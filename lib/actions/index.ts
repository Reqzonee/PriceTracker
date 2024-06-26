"use server"

import { revalidatePath } from "next/cache";
import { scrapeAmazonProduct } from "../scraper";
import { connectToDB } from "../scraper/mongoose";
import { getAveragePrice, getHighestPrice, getLowestPrice } from "../utils";
import Product from "../models/product.model";
import { EmailContent, User } from "@/types";
import { generateEmailBody, sendEmail } from "../nodemailer";
import nodemailer from 'nodemailer';


export async function scrapeAndStoreProduct(productUrl: string){
    if(!productUrl) return;

    try{
        connectToDB();

        const scrapedProduct = await scrapeAmazonProduct(productUrl);
        if(!scrapedProduct) return;

        let product = scrapedProduct;

        const existingProduct = await Product.findOne({url:scrapedProduct.url});

        if(existingProduct){
            const updatedPriceHistory:any = [
                ...existingProduct.priceHistory,
                {price: scrapedProduct.currentPrice} 
            ]

            product = {
                ...scrapedProduct,
                priceHistory: updatedPriceHistory,
                lowestPrice: getLowestPrice(updatedPriceHistory),
                highestPrice: getHighestPrice(updatedPriceHistory),
                averagePrice: getAveragePrice(updatedPriceHistory), 
            }
        }

        const newProduct = await Product.findOneAndUpdate({
            url:scrapedProduct.url},
            product,
            {upsert:true, new:true}
        );

        revalidatePath(`/products/${newProduct._id}`);

    } catch (error) {
        throw new Error(`Failed to create/update product: ${error}`);
    }
}

export async function getProductById(productId:string){
    try{
        connectToDB();

        const product = await Product.findOne({_id: productId});
        if(!product) return null;
        return product;
    } catch(error){
        console.log(error);
    }
}

export async function getAllProducts(){
    try{
        connectToDB();

        const products = await Product.find();
        return products;
    } catch(error){
        console.log(error);
    }
}

export async function getSimilarProducts(productId:string){
    try{
        connectToDB();

        const currentProduct = await Product.findById(productId);

        if(!currentProduct) return null;

        const similarProducts = await Product.find({
            _id: {$ne : productId}, 
        }).limit(3);

        return similarProducts;
    } catch(error){
        console.log(error);
    }
}

export async function addUserEmailToProduct(productId:string,
    userEmail:string 
){
    try{
        console.log("I am inside addUserEmailToProduct");
        // Send our first email......!
        const product = await Product.findById(productId);
        console.log("product ", product);
        if(!product) return;

        const userExists = product.users.some((user:User)=>user.email===userEmail);
        if(!userExists){
            console.log("User is new ");
            product.users.push({email: userEmail});

            await product.save();

            const emailContent = await generateEmailBody(product, "WELCOME");
            console.log("email Content ", emailContent);

            await sendEmail(emailContent, [userEmail]); 
        }

    } catch(error){
        console.log("error ", error);
    }
}

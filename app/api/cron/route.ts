import Product from "@/lib/models/product.model";
import { generateEmailBody, sendEmail } from "@/lib/nodemailer";
import { scrapeAmazonProduct } from "@/lib/scraper";
import { connectToDB } from "@/lib/scraper/mongoose";
import { getAveragePrice, getEmailNotifType, getHighestPrice, getLowestPrice } from "@/lib/utils";
import { NextResponse } from "next/server";

export async function GET() {
  try {
    connectToDB();

    const products = await Product.find({});

    if (!products) throw new Error("No Product found");

    //1. Scrape leatest product details and update db
    const updatedProducts = await Promise.all(
      products.map(async (currentProduct) => {
        const scrapedProduct = await scrapeAmazonProduct(currentProduct.url);

        if (!scrapedProduct) throw new Error("No product found");

        const updatedPriceHistory: any = [
          ...currentProduct.priceHistory,
          { price: scrapedProduct.currentPrice },
        ];

        const product = {
          ...scrapedProduct,
          priceHistory: updatedPriceHistory,
          lowestPrice: getLowestPrice(updatedPriceHistory),
          highestPrice: getHighestPrice(updatedPriceHistory),
          averagePrice: getAveragePrice(updatedPriceHistory),
        };

        const updatedProduct = await Product.findOneAndUpdate(
          {
            url: scrapedProduct.url,
          },
          product,
          { upsert: true, new: true }
        );

        // 2. check each product's status and send email accordigly
        const emailNotifyType = getEmailNotifType(scrapedProduct, currentProduct);

        if(emailNotifyType && updatedProduct.user.length > 0){
            const productInfo = {
                title: updatedProduct.title,
                url: updatedProduct.url,
            }

            const emailContent = await generateEmailBody(productInfo, emailNotifyType);

            const userEmails = updatedProduct.users.map((user:any)=>user.email)

            await sendEmail(emailContent, userEmails);
        }
        return updatedProduct
      })
    );
    return NextResponse.json({
        message:'Ok', data:updatedProducts
    })
  } catch (error) {
    throw new Error(`Error in GET: ${error}`);
  }
}

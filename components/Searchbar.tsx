"use client"

import { scrapeAndStoreProduct } from "@/lib/actions";
import { FormEvent, useEffect, useState } from "react"

const Searchbar = () => {

    const [searchPrompt, setSearchPromt] = useState('');
    const [isLoading, setIsLoading] = useState(false);

    const isValidAmazonProductURL = (url: string)=>{
        try{
            const parsedURL = new URL(url);
            const hostname = parsedURL.hostname;

            // if(hostname.includes('amazon.com') || hostname.includes('amazon.') || hostname.endsWith('amazon')){
                return true;
            // }
        } catch(error){
            return false;
        }
    }

    useEffect(() => {
        console.log("Loading state changed: ", isLoading);
    }, [isLoading]);

    const handleSubmit = async (event: FormEvent<HTMLFormElement>)=>{
        console.log("Form submitted");
        event.preventDefault();
        

        const isValidLink = isValidAmazonProductURL(searchPrompt);
        if(!isValidLink){
            return alert('Please provide a valid Amazon link');
        }

        try{
            setIsLoading(true);
            console.log("Starting product scraping");

            // Scrape the product page
            const product = await scrapeAndStoreProduct(searchPrompt);
            console.log("Product: ", product);
        } catch(error){
            console.log(error);
        } finally{
            setIsLoading(false);
            console.log("Finished product scraping");
        }
    }

  return (
    <form className='flex flex-wrap gap-4 mt-12' onSubmit={handleSubmit}>
        <input
            type="text"
            value={searchPrompt}
            onChange={(e)=> setSearchPromt(e.target.value)}
            placeholder="Enter product link"
            className="searchbar-input"
        />
        <button type="submit" className="searchbar-btn" >
            {isLoading ? 'Searching...' : 'Search'}
        </button>
    </form>
  )
}

export default Searchbar

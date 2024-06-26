import mongoose from 'mongoose';

let isConnected = false;// Variable to track connection status

export const connectToDB = async ()=>{
    mongoose.set('strictQuery', true);
    if(!'mongodb+srv://bhattparaj2:au54Hf5OAGzO6H7Q@cluster0.tektrp6.mongodb.net/?retryWrites=true&w=majority&appName=Cluster0') return console.log('MONGODB_URI is not defined');

    if(isConnected) return console.log('=> using existing database connection');
 
    try{
        await mongoose.connect('mongodb+srv://bhattparaj2:au54Hf5OAGzO6H7Q@cluster0.tektrp6.mongodb.net/?retryWrites=true&w=majority&appName=Cluster0');
        isConnected=true;
        console.log('MongoDB Connected');
    } catch(error){

    }
}
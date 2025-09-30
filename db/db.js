import axios from 'axios';
import mongoose from 'mongoose';
import {db_name} from '../constants.js'

export const connectDB = async () => {
    try {
        const connectionInstance = await mongoose.connect(
            `${process.env.CONNECTION_STRING}/${db_name}`,
            {
                useNewUrlParser: true,
                useUnifiedTopology: true
            }
        );
        console.log("MongoDB connected successfully");
    } catch (error) {
        console.error("MongoDB connection error:", error.message);
        process.exit(1); // Exit if DB connection fails
    }
}
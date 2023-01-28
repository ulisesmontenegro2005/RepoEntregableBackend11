import mongoose from 'mongoose';
import * as models from "./config/models.js";

const URL = 'mongodb+srv://ulisesmontenegro:Dragonci170605@backendpractice.enqgm9k.mongodb.net/DatabaseDesafio9?retryWrites=true&w=majority';

export class Mongo {
    async getMsg () {
        let data;

        data = await models.messages.find({}, {_id:0, __v:0});

        const stringifyData = JSON.stringify(data);
        const parsedData = JSON.parse(stringifyData);

        return parsedData;
    }

    async addMsgMongo (mensaje) {

        const newuser = new models.messages(mensaje);
        await newuser.save();

    }
}

mongoose.Promise = global.Promise;

export const connect = async () => {
    mongoose.connect(URL, { useNewUrlParser: true, useUnifiedTopology: true });

    const db = mongoose.connection;
    db.on("error", () => {
        console.log("could not connect");
    });
    db.once("open", () => {
        console.log("> Successfully connected to database");
    });
};

export const disconnect = () => {
    mongoose.disconnect()
};


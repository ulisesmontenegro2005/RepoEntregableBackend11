import mongoose from 'mongoose';
import * as models from "./config/models.js";

const URL = 'mongodb+srv://ulisesmontenegro:Dragonci170605@backendpractice.enqgm9k.mongodb.net/DatabaseDesafio9?retryWrites=true&w=majority';

export class Mongo {
    async getMsg () {
        let data;

        await mongoose.connect(URL, {
            useNewUrlParser: true,
            useUnifiedTopology: true
        });

        data = await models.messages.find({}, {_id:0, __v:0});

        const stringifyData = JSON.stringify(data);
        const parsedData = JSON.parse(stringifyData);

        mongoose.disconnect();

        return parsedData;
    }

    async addMsgMongo (mensaje) {
        await mongoose.connect(URL, {
            useNewUrlParser: true,
            useUnifiedTopology: true
        });

        const newuser = new models.messages(mensaje);
        await newuser.save();

        mongoose.disconnect();
    }
}

// export class MongoSessions {
//     async registerSession (username, password, email) {
//         await mongoose.connect(URL, {
//             useNewUrlParser: true,
//             useUnifiedTopology: true
//         });

//         const data = {
//             username: username,
//             password: password,
//             email: email
//         };

//         const newsession = new models.sessions({
//             username: username,
//             password: password,
//             email: email
//         });
//         await newsession.save();

//         mongoose.disconnect();

//         return data;
//     }

//     async getSessionByUsername (username) {
//         let session;

//         await mongoose.connect(URL, {
//             useNewUrlParser: true,
//             useUnifiedTopology: true
//         });

//         session = await models.sessions.findOne({username: username}, {__v: 0, _id: 0});

//         mongoose.disconnect()

//         return session;
//     }
// }


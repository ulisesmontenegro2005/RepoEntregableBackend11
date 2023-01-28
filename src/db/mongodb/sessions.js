import mongoose from 'mongoose';
import bcrypt from 'bcrypt';

const { Schema } = mongoose;

const UserSchema = new Schema ({
    username: {
        type: String,
        required: true
    },
    password: {
        type: String,
        required: true
    },
    email: {
        type: String,
        required: true  
    }
})

UserSchema.pre('save', async function(next) {
    try {
        const saltRounds = 10

        let user = this;

        await bcrypt.genSalt(saltRounds, function(err, salt) {
            bcrypt.hash(user.password, salt, function(err, hash) {
                user.password = hash;
            });
        });

        this.password = user.password

        next()
    } catch (err) {
        return next(err);
    }
})

export const matchPassword = async (password, sessionPassword) => {
    try {
        if (password == sessionPassword) {
            return true
        }
    } catch (err) {
        console.log(err);
    }
}

const UserModel = mongoose.model('user', UserSchema);

export default UserModel;
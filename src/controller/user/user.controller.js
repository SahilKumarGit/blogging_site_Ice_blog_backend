const { good, bad } = require("../../config/response.config");
const { userModel } = require('./../../model/user.model')
const jwt = require('jsonwebtoken');
const { emptyObject, emptyString, invalidEmail, invalidPassword, invalidURL, invalid64BitImg } = require("../../library/validation.library");
const bcrypt = require('bcrypt');
const { decodeBase64Image } = require("../../library/64bitToFileConveter.library");
const { uploadFile } = require("../../config/aws.config");
const { default: mongoose } = require("mongoose");
const { blogModel } = require("../../model/blog.model");
const saltRounds = 10;


async function register(req, res) {
    try {
        // get body
        const data = req.body
        if (emptyObject(data)) return bad(res, 400, true, "post body is required")
        let { name, email, password, profilePic } = data
        if (emptyString(name)) return bad(res, 400, true, "Name is required")
        if (emptyString(email)) return bad(res, 400, true, "Email is required")
        if (invalidEmail(email)) return bad(res, 400, true, "Invalid email address!")
        if (emptyString(password)) return bad(res, 400, true, "Password is required")
        if (invalidPassword(password)) return bad(res, 400, true, "Invalid password (it must have A-Z, a-z, 0-9 and spacal char.)!")
        if (emptyString(profilePic)) return bad(res, 400, true, "Profile pic is required!")
        if (invalid64BitImg(profilePic)) return bad(res, 400, true, "Profile pic format is invalid!")

        // dbcall For email
        const isExist = await userModel.findOne({ email }).select({ _id: 1 })
        if (isExist) return bad(res, 400, true, "Email address is already exist!")

        // convert text to hash
        const hashPsaaword = await bcrypt.hash(password, saltRounds)

        // store 64 bit img file in aws
        const bufferFile = decodeBase64Image(profilePic)
        const url = await uploadFile(bufferFile)

        // store user data in db
        const user = await userModel.create({
            name, email, password: hashPsaaword, profilePic: url
        })

        good(res, 200, true, {}, 'Account Created Successfully!')
    } catch (e) {
        console.log(e)
        bad(res, 500, true, e.message)
    }
}

async function login(req, res) {
    try {
        // get body
        const data = req.body
        if (emptyObject(data)) return bad(res, 400, true, "post body is required")
        let { email, password } = data
        if (emptyString(email)) return bad(res, 400, true, "Email is required")
        if (invalidEmail(email)) return bad(res, 400, true, "Invalid email address!")
        if (emptyString(password)) return bad(res, 400, true, "Password is required")
        if (invalidPassword(password)) return bad(res, 400, true, "Invalid password (it must have A-Z, a-z, 0-9 and spacal char.)!")


        // dbcall For email
        const user = await userModel.findOne({ email }).select({ following: 0, follower: 0, bookmarsk: 0 })
        if (!user) return bad(res, 400, true, "User not exist!")

        // check password
        bcrypt.compare(password, user.password, (err, result) => {
            if (err) return bad(res, 400, true, err.message)
            if (!result) return bad(res, 400, true, "Invalid email or password!")

            // jwt token
            const token = jwt.sign({ userId: user._id.toString() }, process.env.SIGNATURE);
            return good(res, 200, true, { token }, 'User Loggedin!')
        });

    } catch (e) {
        bad(res, 500, true, e.message)
    }
}


async function updateProfile(req, res) {
    try {
        // get body
        const data = req.body
        const userData = req.user

        if (emptyObject(data)) return bad(res, 400, true, "post body is required")
        let { name, email, profilePic } = data
        if (emptyString(name)) return bad(res, 400, true, "Name is required")
        if (emptyString(email)) return bad(res, 400, true, "Email is required")
        if (invalidEmail(email)) return bad(res, 400, true, "Invalid email address!")
        if (emptyString(profilePic)) return bad(res, 400, true, "Profile pic is required!")

        // dbcall For email
        const isExist = await userModel.findOne({ email, _id: { $ne: userData._id.toString() } }).select({ _id: 1 })
        if (isExist) return bad(res, 400, true, "Email address is already exist!")

        if (!invalid64BitImg(profilePic)) {
            // store 64 bit img file in aws
            const bufferFile = decodeBase64Image(profilePic)
            const url = await uploadFile(bufferFile)
            userData.profilePic = url
        } else if (!invalidURL(profilePic)) {
            userData.profilePic = profilePic
        }

        userData.name = name;
        userData.email = email;
        await userData.save();

        good(res, 200, true, userData, 'Profile updated Successfully!')
    } catch (e) {
        console.log(e)
        bad(res, 500, true, e.message)
    }
}



async function basicUser(req, res) {
    const user = req.user
    good(res, 200, true, { _id: user._id, name: user.name, profilePic: user.profilePic, email: user.email })
}



async function profile(req, res) {
    try {
        const userId = req.userId
        const uid = req.params.uid

        if (!mongoose.isValidObjectId(uid)) return bad(res, 404, true, "User Info Not Found!")
        const user = await userModel.findById(uid.toString()).select({ name: 1, profilePic: 1, following: 1, follower: 1, verified: 1 })
        const output = {}
        output.user = {
            name: user.name,
            profilePic: user.profilePic,
            _id: user._id,
            viewByOwner: userId == uid,
            followed: user.follower.includes(userId),
            follower: user.follower.length,
            following: user.following.length,
            verified: user.verified
        }

        const blog = await blogModel.find({ isDeleted: false, isPublished: true, userId: uid })
            .select({ title: 1, innerText: 1, createdAt: 1, _id: 1, userId: 1, imgUrl: 1 }).sort({ createdAt: -1 });

        output.blog = blog

        good(res, 200, true, output)
    } catch (e) {
        bad(res, 500, true, e.message)
    }

}



async function followUnfollow(req, res) {
    try {
        const userId = req.userId
        const uid = req.params.uid
        let followed = false;

        if (uid == userId) return bad(res, 400, true, "You can't follow yourself!")

        if (!mongoose.isValidObjectId(uid)) return bad(res, 400, true, "Invalid user id!")

        // add follower on profile
        const user = await userModel.findById(uid.toString()).select({ follower: 1 })
        if (!user) return bad(res, 404, true, "User's info not found!")


        // add following on profile
        const my = await userModel.findById(userId.toString()).select({ following: 1 })
        if (!my) return bad(res, 404, true, "Your info not found!")

        const follower_index = user.follower.indexOf(userId.toString())
        const following_index = my.following.indexOf(uid.toString())
        if (follower_index >= 0 && following_index >= 0) {
            user.follower.splice(follower_index, 1)
            my.following.splice(following_index, 1)
            followed = false
        } else {
            user.follower.push(userId.toString())
            my.following.push(uid.toString())
            followed = true
        }

        await user.save()
        await my.save()

        good(res, 200, true, { followed })
    } catch (e) {
        bad(res, 500, true, e.message)
    }

}




module.exports = { register, login, updateProfile, basicUser, profile, followUnfollow }
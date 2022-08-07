const aws = require('aws-sdk');


aws.config.update({
    accessKeyId: "AKIAQARKEUJJBLPSKF3L",
    secretAccessKey: "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",
    region: "ap-south-1"
})


let uploadFile = async (file, debug = false) => {
    return new Promise(function (resolve, reject) {
        // this function will upload file to aws and return the link
        let s3 = new aws.S3({
            apiVersion: '2006-03-01'
        });
        // we will be using the s3 service of aws

        var uploadParams = {
            ACL: "public-read",
            Bucket: "sahilk69",
            Key: "users/file_" + new Date().getTime() + file.originalname,
            Body: file.buffer
        }

        s3.upload(uploadParams, function (err, data) {
            if (err) {
                if (debug) console.log(data)
                return reject(err)
            }

            if (debug) console.log("file uploaded succesfully, Path:", data.Location)
            return resolve(data.Location)
        })

    })
}

module.exports = {
    uploadFile
}
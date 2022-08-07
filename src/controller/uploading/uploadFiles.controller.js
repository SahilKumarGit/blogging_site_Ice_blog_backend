const { uploadFile } = require("../../config/aws.config")
const { good, bad } = require("../../config/response.config")
const { decodeBase64Image } = require("../../library/64bitToFileConveter.library");
const { emptyObject, emptyString, invalid64BitImg } = require("../../library/validation.library");

async function upload(req, res) {
    try {
        const files = req.files || []
        if (files.length <= 0) return bad(res, 400, true, 'Please select a file!')
        const url = await uploadFile(files[0])
        good(res, 201, false, { url })
    } catch (e) {
        console.log(e)
        bad(res, 500, true, e.message)
    }
}

async function uploadProfilePic(req, res) {
    try {
        const data = req.body
        // console.log(data)
        if(emptyObject(data)) return bad(res,400,true,'post body required!')

        const img64 = data.img64
        if(emptyString(img64)) return bad(res,400,true,'64bit image file is required!')

        if(invalid64BitImg(img64)) return bad(res,400,true,'invalid 64bit image file!')

        const bufferFile = decodeBase64Image(img64)
        const url = await uploadFile(bufferFile)
        good(res, 201, false, { url })
    } catch (e) {
        console.log(e)
        bad(res, 500, true, e.message)
    }
}


module.exports = { upload, uploadProfilePic }
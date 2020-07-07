const nodemailer = require('nodemailer');

module.exports = {
    sendMail: async function(token){
        let transporter = nodemailer.createTransport({
            host: "smtp.gmail.com",
            port: 587,
            secure: false, // true for 465, false for other ports
            auth: {
                user: "Madarauchiha3524@gmail.com", // generated ethereal user
                pass: 'tyiwcqabfhorbdgw', // generated ethereal password
            }
        });
        var verifyUrl = "http://slabber.herokuapp.com/confirmation?token="+token.token+"&email="+token.email+"\n." ;
        let info = await transporter.sendMail({
            from: '"Slabber Services" <Madarauchiha3524@gmail.com>', // sender address
            to: token.email, // list of receivers
            subject: "Email Verification at Slabber", // Subject line
            text: "", // plain text body
            html: "Hello,\n\n"+"Please confirm your account creation request at Slabber, by clicking this link \n" + verifyUrl, //html body
        });
        return info;
    }
}
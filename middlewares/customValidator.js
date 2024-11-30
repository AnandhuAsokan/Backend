const validateEmail = (req,res,next) =>{
    const email = req.body.email;
    const errors = [];

    if(!isValidEmail(email)) {
        errors.push({msg:'invalid email address'});
    }
    req.validationErrors = req.validationErrors || [];
    req.validationErrors.push(...errors);

    next();
};

const validatePassword = (req,res,next)=>{
    const password = req.body.password;
    const errors = [];

    if(!isValidPassword){
        errors.push({msg:'invalid password'})
    }
    req.validationErrors = req.validationErrors || [];
    req.validationErrors.push(...errors);

    next();
};

const isValidEmail = (email) =>{
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    return emailRegex.test(email);
};

const isValidPassword = (password)=>{
    const passwordRegex = /^(?=.*[a-z])(?=.*[A-Z])(?=.*\d)(?=.*[@$!%*?&])[A-Za-z\d@$!%*?&]{8,}$/;
    return passwordRegex.test(password);
};

module.exports = {validateEmail, validatePassword};

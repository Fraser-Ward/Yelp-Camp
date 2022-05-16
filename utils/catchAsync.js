module.exports = func => {
    return (req, res, next) => {
        func(req, res, next).catch(next);
    }
}

// a function to wrap around callbacks so try and catch does not have to be wrapped around middleware, to hit error handler
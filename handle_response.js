const logger = require('./lib/logger')('handle_response')


function handleFloatProps(data) {
    return
    if (data == null) { 
        return
    }

    let props = Object.getOwnPropertyNames(data)
    
    props.forEach(prop => {
        let value = data[prop]
        if (prop == 'sjccsl' || prop == 'totalCount') {
            return
        }
        logger.debug(`${prop} = ${value}`)
        if (value != null && data[prop].toFixed && typeof data[prop].toFixed == 'function') {
            data[prop] = data[prop].toFixed(2)
        }
        if (value != null && Array.isArray(value)) {
            for(var i = 0; i < value.length; i++) {
                handleFloatProps(value[i])
            }
        }
    })
    
}


var a = {
    amount: 1.0,
    name: 'jin',
    list: [1, 2, 3]
}

handleFloatProps(a)
console.log(a)

module.exports = {
    handleFloatProps
}
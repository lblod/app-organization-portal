export const API_STATUS_CODES = {
    OK:{
        STATUS: "OK",
        CODE: 200
    },
    ERROR_NO_DATA_WEGWIJS:{
        STATUS: "no data has been found, check if kbo numer is correct or organisation has OVO number. Organisation without OVO number are not in wegwijs",
        CODE: 500
    },
    STATUS_NO_DATA_OP:{
        STATUS: "no kbo number found in OP",
        CODE: 400,
    }, 
    CUSTOM_SERVER_ERROR:{
        STATUS: '',
        CODE: 500
    } 
}
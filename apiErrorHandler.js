export const API_STATUS_CODES = {
    STATUS_200:{
        STATUS: "OK",
        CODE: 200
    },
    STATUS_402:{
        STATUS: "no data has been found, check if kbo numer is correct or organisation has OVO number. Organisation without OVO number are not in wegwijs",
        CODE: 402
    },
    STATUS_403:{
        STATUS: "no kbo number found in OP",
        CODE: 403
    }, 
    STATUS_500:{
        STATUS: '',
        CODE: 500
    } 
}
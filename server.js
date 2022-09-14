const express = require('express');
const XLSX = require('xlsx');
const upload = require('express-fileupload');
const axios = require('axios');
const json2xls = require('json2xls');

const app = express();
const PORT = 5000;
// const upload = multer();

//MIDDLEWARES
app.use(express.json());
app.use(upload());
app.use(json2xls.middleware);

app.get('/', async (req, res) => {
    res.sendFile(__dirname + '/index.html');
});

//ROUTES
app.post('/', async (req, res) => {
    var file = req.files.file;
    var filename = req.files.file.name;
    // console.log(req.files.file.name);
    // console.log(req.files.file);

    await file.mv('./uploads/' + filename, (err) => {
        if (err) {
            console.log(err);
        } else {
            console.log('File Uploaded.')
        }
    })

    const workbook = XLSX.readFile('./uploads/'+filename);
    const worksheet = workbook.Sheets.Sheet1;
    // console.log(worksheet);
    let data = XLSX.utils.sheet_to_json(worksheet);
    // console.log(data);
    const fetchData = async (productCode) => {
        let productPrice;
        const url = `https://api.storerestapi.com/products/${productCode}`
        await axios.get(url)
            .then((result) => {
                // console.log("RESULT", result.data);
                productPrice = result.data.data.price;
            })
            .catch((error) => {
                console.log("Couldn't fetch data.");
                console.log(error);
            })
        return productPrice

    }

    for (let i=0; i<data.length; i++) {
        let productPrice
        await fetchData(data[i].product_code)
            .then((result) => {
                productPrice = result;
            })
            .catch((error) => {
                console.log(error);
            })
        data[i]['product_price'] = productPrice;
    }
    console.log("DATA", data);
    return res.xls('data.xlsx', data);
})

app.listen(PORT, () => {
    console.log(`Server running on port ${PORT}`);
});
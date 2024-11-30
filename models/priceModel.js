const mongoose = require("mongoose");
const priceSchema = new mongoose.Schema({
    Discount: {
        fasions:{type: Number,
            
        },
        medicines:{type: Number,
            
        },
        electronics:{type: Number,
            
        },
        grocery:{type: Number,
            
        },
    },
    GST: {
        fasions:{type: Number,
            
        },
        medicines:{type: Number,
            
        },
        electronics:{type: Number,
            
        },
        grocery:{type: Number,
            
        },
    }
});

const Price = mongoose.model("Price", priceSchema);

module.exports = Price;

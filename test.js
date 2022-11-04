var lineReader = require('line-reader');
var fs = require('fs')

var jsonObj = {};
var obj = [];
var file = "myu.json"
var num= 0;

lineRead();
async function lineRead(){
lineReader.eachLine('input.txt', function(line, last) {
// to check on which line we're.
      console.log(num);
      num++;
      convertJson(line)

      if(last){
//when it's last line we convert json obj to string and save it to new file.
        var data = JSON.stringify(obj)
        fs.writeFileSync(file,data);

      }
});
}

function convertJson(data){
        var currentVal = data
        var value = JSON.parse(data)
        var temp = value;
//storing the value in json object
        jsonObj = value;
        obj.push(jsonObj);
    }
  
}
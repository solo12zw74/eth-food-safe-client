import cryptoJs from "crypto-js";
import Web3 from "web3";

var web3 = new Web3(Web3.givenProvider);
var foodSafeABI, foodSafeContract, account, deployedContract, foodSafeCode;

window.App = {
    start: function () {
        web3.eth.getAccounts(function (err, accounts) {
            account = accounts[0];
            web3.eth.defaultAccount = account;
        });
        const httpRequest = new XMLHttpRequest();
        const url = "http://localhost:3000";
        httpRequest.open("GET", url);
        httpRequest.send();
        httpRequest.onreadystatechange = function () {
            if (this.readyState == 4 && this.status == 200) {
                var output = JSON.parse(this.response);
                foodSafeCode = output.bytecode;
                var metadata = JSON.parse(output.metadata);
                foodSafeABI = metadata.output.abi;
                foodSafeContract = new web3.eth.Contract(foodSafeABI);
            }
        };
    },
    createContract: function () {
        foodSafeContract.deploy({ data: foodSafeCode }).send({ from: account, data: foodSafeCode, gas: 3000000 })
            .on("confirmation", function (confirmationNumber, receipt) { })
            .then(function (newContractInstance) {
                deployedContract = newContractInstance;
                document.getElementById("contractAddress").value = deployedContract.options.address;
            });
    },
    addNewLocation: function () {
        var contractAddress = document.getElementById("contractAddress").value;
        var deployedFoodSafe = new web3.eth.Contract(foodSafeABI, contractAddress, { from: account, gas: 3_000_000 });
        var locationId = document.getElementById("locationId").value;
        var locationName = document.getElementById("locationName").value;
        var locationSecret = document.getElementById("secret").value;
        var passPhrase = document.getElementById("passphrase").value;
        var encryptedSecret = cryptoJs.AES.encrypt(locationSecret, passPhrase).toString();
        deployedFoodSafe.methods.AddNewLocation(locationId, locationName, encryptedSecret).send({ from: account });
    },
    getCurrentLocation: function () {
        var contractAddress = document.getElementById("contractAddress").value;
        var deployedFoodSafe = new web3.eth.Contract(foodSafeABI, contractAddress, { from: account, gas: 3_000_000 });
        var passPhrase = document.getElementById("passphrase").value;
        deployedFoodSafe.methods.GetTrailcount().call().then(function (trailCOunt) {
            deployedFoodSafe.methods.GetLocation(trailCOunt - 1).call().then(function (location) {
                document.getElementById("locationId").value = location[1];
                document.getElementById("locationName").value = location[0];
                var encryptedSecret = location[4];
                var decryptedSecret = cryptoJs.AES.decrypt(encryptedSecret, passPhrase).toString(cryptoJs.enc.Utf8);
                document.getElementById("secret").value = decryptedSecret;
            });
        });
    }
}

window.addEventListener("load", function () {
    App.start();
});
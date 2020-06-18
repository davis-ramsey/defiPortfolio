const etherscanKey = 'SNU2RTHHYNB5IHGSBV82P5977AGUR5YG2V';
const input = document.querySelector('#address');
const onInput = (event) => {
	//on start, erases all previous data before generating the table
	for (let i = 0; i < 8; i++) {
		document.getElementById(`${i}`).innerHTML = ``;
		document.getElementById('footer').innerHTML = ``;
		tokenAddr.pop();
		tokenNames.pop();
		tokenBalance.pop();
		tokenWeight.pop();
		tokenId.pop();
		tokenPrice.pop();
		tokenMarketValue.pop();
	}
	run(event.target.value.toLowerCase());
};
input.addEventListener('input', debounce(onInput, 500)); //waits for user input to finish before loading

const tokenId = []; // array for token ID's for coingeck old price api
const tokenAddr = []; //array for token contract addresses
const tokenNames = []; // array for token names
const tokenBalance = []; // array for token balances
const tokenWeight = []; // array for token weight
const tokenPrice = [];
const tokenMarketValue = [];
let day; //variable for historical market value placement
let time; // timestamp
let block; // block number

run = function(address) {
	// runs program
	getPool(address); //get current token balances for selected pool
	time = (Date.now() / 1000).toFixed(0) - 86400; //set timestamp to 24 hours ago 10246959
	day = 'dayTotal';
	getBlocks(); //get block number
	setTimeout(() => {
		printData(tokenBalance, tokenNames, tokenWeight, tokenPrice);
		getOldPrice(); // get historical price data
	}, 1000);
	setTimeout(() => {
		getTokenBalance(address, day); // get token balances at block number
	}, 2000);
	setTimeout(() => {
		time = (Date.now() / 1000).toFixed(0) - 604800; //set timestamp to 1 week ago
		day = 'weekTotal';
		getBlocks(); //get block number
	}, 3000);
	setTimeout(() => {
		getOldPrice(); //get historical price data
	}, 4000);
	setTimeout(() => {
		getTokenBalance(address, day);
		if (tokenPrice.length !== 0) {
			document.querySelector('.subtitle').innerHTML =
				'<span class="has-text-success-dark">Finished! Check table below for data.</span>';
			document.querySelector('#table').classList.remove('is-hidden');
		}
	}, 5000); // get token balances at block number
};

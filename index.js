const etherscanKey = 'SNU2RTHHYNB5IHGSBV82P5977AGUR5YG2V';
const input = document.querySelector('#address');
const onInput = (event) => {
	document.querySelector('#table').classList.add('is-hidden');
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
	run(event.target.value.trim().toLowerCase());
};
input.addEventListener('input', debounce(onInput, 500)); //waits for user input to finish before loading

const tokenId = []; // array for token ID's for coingeck old price api
const tokenAddr = []; //array for token contract addresses
const tokenNames = []; // array for token names
const tokenBalance = []; // array for token balances
const tokenWeight = []; // array for token weight
const tokenPrice = []; // array for token prices
const tokenMarketValue = []; // array for market value
let portfolioValue = 0; // variable for current portfolio market value
let day; //variable for historical market value placement
let time; // timestamp
let block; // block number

run = async (address) => {
	// runs program
	await getPool(address) //gets pool information
		.then(({ data }) => {
			//fills in various arrays and lets user know program is working
			document.querySelector('.subtitle').innerHTML =
				'<span class="has-text-success-dark">Gathering information...</span>';
			const tokens = data.data.pools[0].tokens;
			const weight = data.data.pools[0].totalWeight;
			for (let element of tokens) {
				tokenBalance.push(parseFloat(element.balance).toFixed(2));
				tokenAddr.push(element.address);
				tokenNames.push(element.symbol);
				if (weight !== 50) tokenWeight.push((element.denormWeight * (50 / weight)).toFixed(2));
				else tokenWeight.push(element.denormWeight);
			}
		})
		.catch((err) => {
			//if user enters input that is not a balancer pool address, this will display
			document.querySelector('.subtitle').innerHTML =
				'<span class="has-text-danger-dark">Error! Please enter a valid Balancer Pool address.<br>For example, 0x987D7Cc04652710b74Fff380403f5c02f82e290a</span>';
		});
	await getPrice(); //get current market prices
	printData(tokenBalance, tokenNames, tokenWeight, tokenPrice); //fill in first part of table
	time = (Date.now() / 1000).toFixed(0) - 86400; //set timestamp to one day ago
	day = 'dayTotal'; //let functions know we're gathering info for one day ago
	await getOldPrice(); // get old token prices
	await getBlocks(address); //get block number at current timestamp
	getTokenBalance(address); //get token balances at new block number and fill in the table
};

getWeek = async (address) => {
	time = (Date.now() / 1000).toFixed(0) - 604800; //set timestamp to 1 week ago
	day = 'weekTotal'; //let functions know we're gathering info for one week ago
	await getOldPrice(); //get old token prices
	await getBlocks(address); //get block number at current time stamp
	getTokenBalance(address); //get token balances at new block number and fill in the table
	document.querySelector('.subtitle').innerHTML =
		'<span class="has-text-success-dark">Finished! Check table below for data.</span>';
	document.querySelector('#table').classList.remove('is-hidden');
};

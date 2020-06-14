if (typeof web3 !== 'undefined') {
	// check for metamask
	console.log('Web3 Detected! ' + web3.currentProvider.constructor.name);
	window.web3 = new Web3(web3.currentProvider);
} else {
	//use infura if no metamask
	console.log('No Web3 Detected... using HTTP Provider');
	window.web3 = new Web3(
		new Web3.providers.HttpProvider('https://mainnet.infura.io/v3/9fae5b9115104b5da6eabf0294102584')
	);
}
const debounce = (func, delay = 1000) => {
	let timeoutId;
	return (...args) => {
		if (timeoutId) {
			clearTimeout(timeoutId);
		}
		timeoutId = setTimeout(() => {
			func.apply(null, args);
		}, delay);
	};
};
const minABI = [
	// balanceOf
	{
		constant: true,
		inputs: [ { name: '_owner', type: 'address' } ],
		name: 'balanceOf',
		outputs: [ { name: 'balance', type: 'uint256' } ],
		type: 'function'
	},
	// decimals
	{
		constant: true,
		inputs: [],
		name: 'decimals',
		outputs: [ { name: '', type: 'uint8' } ],
		type: 'function'
	}
];
function timeConverter(UNIX_timestamp) {
	var a = new Date(UNIX_timestamp * 1000);
	var months = [ '01', '02', '03', '04', '05', '06', '07', '08', '09', '10', '11', '12' ];
	var year = a.getFullYear();
	var month = months[a.getMonth()];
	var date = a.getDate();
	var hour = a.getHours();
	var min = a.getMinutes();
	var sec = a.getSeconds();
	var time = date + '-' + month + '-' + year;
	return time;
}
getPool = function(address) {
	//gets current token balances for selected balancer pool
	axios({
		url: 'https://api.thegraph.com/subgraphs/name/balancer-labs/balancer',
		method: 'post',
		data: {
			query: `{
      pools(where: {id: "${address}"
    }) {
        id
        swapFee
        totalWeight
        tokensList
        tokens {
          id
          address
          decimals
          balance
          symbol
          denormWeight
        }
      }
    }
    `
		}
	})
		.then(({ data }) => {
			const tokens = data.data.pools[0].tokens;
			const weight = data.data.pools[0].totalWeight;
			for (let element of tokens) {
				tokenBalance.push(parseFloat(element.balance).toFixed(2));
				tokenAddr.push(element.address);
				tokenNames.push(element.symbol);
				if (weight !== 50) tokenWeight.push((element.denormWeight * (50 / weight)).toFixed(2));
				else tokenWeight.push(element.denormWeight);
			}
			getPrice();
		})
		.catch((err) => {
			console.log(err);
		});
};
getPrice = function() {
	for (let i = 0; i < tokenAddr.length; i++) {
		axios({
			url: `https://api.coingecko.com/api/v3/coins/ethereum/contract/${tokenAddr[i]}`
		})
			.then((result) => {
				tokenPrice[i] = result.data.market_data.current_price.usd;
				tokenId[i] = result.data.id;
			})
			.catch((err) => {
				console.log(err);
			});
	}
};
getOldPrice = function() {
	for (let i = 0; i < tokenAddr.length; i++) {
		axios({
			url: `https://api.coingecko.com/api/v3/coins/${tokenId[i]}/history?date=${timeConverter(time)}`
		})
			.then((result) => {
				tokenPrice[i] = result.data.market_data.current_price.usd;
			})
			.catch((err) => {
				console.log(err);
			});
	}
};
getTokenBalance = (address, day) => {
	let sumTotal = 0;
	//get token balances for the balancer pool
	for (let i = 0; i < tokenAddr.length; i++) {
		//get token balance at block time
		let contract = web3.eth.contract(minABI).at(tokenAddr[i]);
		contract.balanceOf(address, block, (error, balance) => {
			// Get decimals
			contract.decimals((error, decimals) => {
				// calculate a balance
				balance = balance.div(10 ** decimals);
				sumTotal += tokenPrice[i] * parseFloat(balance).toFixed(2);
				document.getElementById(day).innerHTML = `$${Number(sumTotal.toFixed(2)).toLocaleString()}`;
				const difference = ((tokenBalance[i] / parseFloat(balance).toFixed(2) - 1) * 100).toFixed(2);
				if (parseFloat(balance).toFixed(0) > 0) {
					if (difference < 0)
						document.getElementById(
							`${i}`
						).innerHTML += `<td class="has-background-danger-light has-text-danger-dark">${difference}%</td><td class="has-background-danger-light has-text-danger-dark">${parseFloat(
							balance
						).toFixed(2)}</td><td>$${tokenPrice[i].toFixed(
							4
						)}</td><td class="has-background-primary-light has-text-success-dark">$${Number(
							(tokenPrice[i] * parseFloat(balance)).toFixed(2)
						).toLocaleString()}</td>`;
					else
						document.getElementById(
							`${i}`
						).innerHTML += `<td class="has-background-primary-light has-text-success-dark">${difference}%</td><td class="has-background-primary-light has-text-success-dark">${parseFloat(
							balance
						).toFixed(2)}</td><td>$${tokenPrice[i].toFixed(
							4
						)}</td><td class="has-background-danger-light has-text-danger-dark">$${Number(
							(tokenPrice[i] * parseFloat(balance)).toFixed(2)
						).toLocaleString()}</td>`;
				}
			});
		});
	}
};
getBlocks = function(address) {
	//get block number from a timestamp
	axios({
		url: `https://api.etherscan.io/api?module=block&action=getblocknobytime&timestamp=${time}&closest=before&apikey=${etherscanKey}`
	})
		.then((result) => {
			block = result.data.result;
		})
		.catch((err) => {
			console.log(err);
		});
};

printData = (bal, name, weight, price) => {
	let sum = 0;
	for (let i = 0; i < bal.length; i++) {
		document.getElementById(`${i}`).innerHTML += `<td>${name[i]}</td><td>$${price[i].toFixed(4)}</td><td>${weight[
			i
		] * 2}%</td><td>${Number(bal[i]).toLocaleString()}</td><td>$${Number(
			(price[i] * bal[i]).toFixed(4)
		).toLocaleString()}`;
		sum += parseFloat((price[i] * bal[i]).toFixed(2));
	}

	document.getElementById('footer').innerHTML = `  <tr>
	<th>Token</th>
	<th>Price</th>
	<th>Portfolio %</th>
	<th>Current Balance</th>
	<th><abbr title="Total Portfolio Market Value">$${Number(sum.toFixed(2)).toLocaleString()}</th>
	<th><abbr title="Percent Change in token balance vs 12 hours ago">-24H</abbr></th>
	<th><abbr title="Token Balance 24 hours ago">Balance</abbr></th>
	<th><abbr title="Token Price 24 hours ago">Price</abbr></th>
	<th><abbr title="Total Market Value 24 hours ago" id="dayTotal"></abbr></th>
	<th><abbr title="Percent Change in token balance vs 1 week ago">-1W</abbr></th>
	<th><abbr title="Total Market Value 1 week ago" id="weekTotal"></abbr></th>

</tr>`;
};

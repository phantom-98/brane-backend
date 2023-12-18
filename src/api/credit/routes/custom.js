 // añado ruta perzonalizada 


module.exports = {
	routes: [
			{
					method: "GET",
					path: "/credits/me",
					handler: "credit.findMe",
			}
	]
};
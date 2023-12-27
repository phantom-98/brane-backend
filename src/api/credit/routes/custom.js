 // añado ruta perzonalizada 


module.exports = {
	routes: [
			{
					method: "POST",
					path: "/credits/me",
					handler: "credit.misCreditos",
			}
	]
};
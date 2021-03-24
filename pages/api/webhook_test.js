export default (req, res) => {
	console.log("webhook", req.body)
	return res.status(200).json(req.body)
}

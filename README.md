# littleX

littleX is a minimalistic social media platform prototype developed using the Jac programming language. It showcases fundamental social media functionalities, including user creation, following, tweeting, commenting, and reacting. Using Jaseci builtin user management system, users represented as roots. Using data spatial features in Jac, Tweets and comments are represented as nodes, while relationships like following, tweeting, and reacting are represented as edges, demonstrating a unique way to model social networks.
<!-- 
- `littleX_v1.jac` => No Encryption, Customized feed, Old Architecture
- `littleX_v2.jac` => Encryption, Customized feed, Old Architecture
- `littleX_v2_1.jac` => Encryption, Customized feed, New Architecture -->

![Architecture](Documentation/images/Architecture.png)

To run the full version of little-X, follow the following instructions.

## Deploying the Back end

1. Check python version. Should be 3.11 or later.
```bash
python --version
```
2. Installing other dependancies.
```bash
pip install -r requirements.txt
```

3. Deploy the full version of the backend app.
```bash
jac serve littleX_full.jac
```

## Deploying the Front end

1. Check current `Node.js` version. 

>(To run the frontend application Node.js needs to installed and having a version 18 or higher. If not installed look into [this](https://nodejs.org/en/download/package-manager) guide.)
```bash
node -v
```

2. Install dependencies snf run the frontend application.
```bash
cd littleX_FE/
npm install
npm run dev
```

After starting the server, the terminal should show a URL (usually http://localhost:5173/ or similar). Open this URL in a web browser to view the app.
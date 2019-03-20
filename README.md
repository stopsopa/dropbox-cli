

# Usage

```bash
git clone https://github.com/stopsopa/dropbox-cli.git
cd dropbox-cli
yarn install

```

Now it's necessary to provide dropbox accessToken, there two ways to do this:

- through enviroment variable DROPBOX_NODE_SECRET
- or by creating tiny js module next THIS js script 'dropbox_node_secret.js' with content:

```javascript

module.exports = "arURX_..._o5QQaXWYf";

```

method one:
```bash

export DROPBOX_NODE_SECRET="arURX_..._o5QQaXWYf"
node dropbox.js list

```

method two:

```bash

echo 'module.exports = "arURX_..._o5QQaXWYf"' > dropbox_node_secret.js
node dropbox.js list

```


... and you're ready to go, just follow instructions on the screen

```bash
node dropbox.js
```



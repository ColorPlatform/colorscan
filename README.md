![Color-Wallet logo — spaceship blasting off](/public/img/Colorblackplatform.png)

# Welcome to Color Explorer!

## Project running on testnet
[Color Explorer by Color-Platform](http://explorer.color-platform.org/)


## How to run Color Explorer

1. Copy `settings.json.default` to `settings.json`.
2. Update the RPC and LCD URLs.
3. Update Bech32 address prefixes.
4. Update genesis file location.

### Run in local

```
meteor npm install
meteor update
meteor --settings settings.json
```

### Run in production

```
./build.sh
```

It will create a packaged Node JS tarball at `../output`. Deploy that packaged Node JS project with process manager like [forever](https://www.npmjs.com/package/forever) or [Phusion Passenger](https://www.phusionpassenger.com/library/walkthroughs/basics/nodejs/fundamental_concepts.html).

---
## Donations :pray:

Color Platform is always free and open. Anyone can use to monitor available Color hub or zones, or port to your own chain built with Color SDK. We welcome any supports to help us improve this project.

CLR: `colors1p9nck20mlgf7nn9yg7rpf5mg0uuztn4skv4q6d`\

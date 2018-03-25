# aria2-ftp

A FTP downloader supports [Segmented Downloading](https://whatbox.ca/wiki/Multi-threaded_and_Segmented_FTP).

Why reinvent the wheel? There's so many free FTP clients already, e.g. [FileZilla](https://filezilla-project.org/).

Well, most FTP clients including FileZilla don't support Segmented Downloading, which is too slow for large downloads.


## Screenshot
![Program UI](/screenshots/main.png)

## Download
Download the latest version from the [releases](https://github.com/balloy/aria2-ftp/releases) page.
Available for Windows.

## Command line support
Besides running it directly, the program also supports command line options:
- --local {directory}: specify initial local directory
- --ftp {address}: specify initial FTP address to connect

## Dev
### Dependencies
Segmented Downloading is implemented via [aria2, "The next generation download utility"](https://aria2.github.io/).
<br />
The packages in [releases](https://github.com/balloy/aria2-ftp/releases) have included it. But for dev, you need to download aria2 binary by your own.

### Install
First, Clone or download the repo and navigate in console to the program's root folder.

And then install dependencies with npm or yarn.

```bash
$ npm install
```

And then get the [aria2](https://github.com/aria2/aria2/releases/) binary, put the executable (naming aria2c*) into
`program's root folder`/aria2, the same folder with aria2.conf.

### Run
Start the app in the `dev` environment.

```bash
$ npm run dev
```

### Packaging
To package for the local platform:

```bash
$ npm run package
```

## Credits
- Main program: [Electron](https://electronjs.org/) + [React](https://reactjs.org/) + [Redux](https://redux.js.org/) + [Webpack](https://webpack.js.org/).
- boilerplate: [electron-react-boilerplate](https://github.com/chentsulin/electron-react-boilerplate).
- UI Framework: [primereact](https://www.primefaces.org/primereact/)
- FTP Browsing: [jsftp](https://github.com/sergi/jsftp)
- FTP Segmented Downloading: [aria2](https://aria2.github.io/)

## License
MIT

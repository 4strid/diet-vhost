# diet-vhost
Virtual hosting platform and control panel using Diet.js

Diet.js supports virtual hosting (serving multiple apps on multiple domains from the same server)
natively. This platform provides a convenient way to organize and run multiple Diet.js applications
with one command, and a web-based control panel for managing those applications.

With the control panel you can:
- Add or remove applications
- Restart individual applications without restarting the whole server
- Set environment variables
- Create multiple users who can manage their own applications

Setup
-----
To get started, clone the repository into whatever directory you like.

```
git clone git@github.com:cutejs/diet-vhost.git
```

NPM install the modules for the top level platform, as well as for the control panel website.

```
cd diet-vhost
npm install
```

```
cd app_modules/ctrl-panel
npm install
```

Next run the setup script to set up the control panel.
```
cd ../..
npm run setup
```

This will prompt you for all the information necessary to get the control panel up and running.

Now you can start the platform with `npm start`. This will serve the control panel at whatever address
you specified in the setup script.

Diet Apps
---------
The platform runs complete Diet apps, each with their own node\_modules which could otherwise run on
their own. Just plop them into the app\_modules directory. I recommend making each app a git repository
that you can `git clone` into the app\_modules directory, and then subsequently use `git pull` to pull
in updates.

```
cd app_modules
git clone git@github.com:username/my-cool-app.git
cd my-cool-app
npm install --only=production
```

There are two caveats:

### Application must module.exports itself
Each application is a completely ordinary Diet.js application, except that it must export the `app` object
created by Diet.

```javascript
const server = require('diet')

const app = server()

//.......

module.exports = app
```

This is necessary for apps to be able to be restarted from the control panel.

### Application must NOT include Diet as a dependency
Install Diet as a devDependency, not a dependency, and use `npm install --only=production` when you
install its dependencies. This way, all apps will share the platform's `diet` module. Otherwise, you will
have multiple instances of Diet and will run into an EADDRINUSE error.

#### app.shutdown

You can set a method called `shutdown` on your application if there is some cleanup that needs to
be performed before tearing down the application.
```
app.shutdown = function (done) {
  // perform cleanup......
  done()
}
```

Starting an app in the control panel
------------------------------------
With your application copied into the app\_modules directory, and with its dependencies installed,
you're ready to start it up in the control panel.

Point a web browser to the address you specified in the setup script, log in with the account you created
and then click on Manage Hosts.

At the bottom in the New Host panel, fill in your application's information where `hostname` is the domain
name your app will be served on, and `module` is the name of the directory it resides in. You can leave
admin blank, as the account you created is an administrator and has access to all the apps by default.

When you hit Create, the platform will save the information to the database and attempt to start the
application.

Environment Variables
---------------------
By default, every app created sets an environment variable named APP\_NAME\_\_HOSTNAME to whatever
hostname you provided. You can use this in your apps to set the hostname to listen on, or you can use some
other method to determine what address to listen on. It's just there if you want it. You can even delete
it if you want to: nothing special about it at all.

You can add other environment variables with the Add Environment Variable button. Because all applications
share one Node process and hence share their environment variables, each variable is prefixed with its
application's module name. Set the name and value, and when you restart the app, your new environment
variables will be available on `process.env`.

To delete an environment variable delete the key. This will leave a dangling prefix: this is considered
blank, and will delete the variable when you save the host.

You should use environment variables to keep sensitive information out of your source code: think API
keys, cookie secrets, usernames, and passwords.

Adding Users
------------
To create additional users who can manage their own sets of applications, go to the Manage Users page
from the control panel home page.

Set the `admin` field of a host to the username of a created user, and they will be able to log in and
manage any applications where `admin` is set to their username. This is case sensitive, so be careful to
type it in correctly.

Starting Over
-------------
You can totally wipe the database with the command `npm run reset`. There is no way to undo this, so be
careful.

Final Notes
-----------
The platform can only run trusted code! All apps share one Node process, and can access each other's
file systems and environment variables. Some day I'd like to support untrusted code but that's a long
way down the line.

Also worth mentioning is that Diet appears to have become abandonware. When I started using it, it still
had recent commits but it's been over a year now since any updates, so don't expect any support from its
creator. If the need arises, I'll fork it and update it myself (or rewrite it completely ( ͡° ͜ʖ ͡°)).

Even before it got abandoned, Diet is... kind of scrappy, that is to say, not quite as nice as Express,
but I've solved its most severe deficiencies with npm modules, and intend to keep writing modules for
it as necessary.

So while you don't have Diet's creator's support, at least you have mine ♥

For bugs, feature requests, and questions (even just about Diet in general) open an issue on Github
and I'll get back to you.

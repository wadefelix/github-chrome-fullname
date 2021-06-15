import { resolve } from "dns"
import "isomorphic-fetch"
const {JSONPath} = require('jsonpath-plus');

interface GitHubUser {
    id: string;
    name: string;
}
interface Options {
    api: string;
    apitype: string;
    jsonpath: string;
}

export class User {
    private user: GitHubUser

    public constructor(user: GitHubUser) {
        this.user = user
    }

    public getName(): string {
        if (this.user && this.user.name) {
            return this.user.name
        }
        return ""
    }

    public getId(): string {
        return this.user.id + ""
    }
}

export class API3 {
    private userMap: Map<string, Promise<User>>
    private readonly chromeStorageExpiry = 1000 * 60 * 60 * 24 * 7; // 1 week
    private options: Options


    public constructor() {
        this.userMap = new Map()
        this.options = {
            api: '',
            apitype: 'plain',
            jsonpath: '',
        }
        let _this = this

        chrome.storage.sync.get({"api": ''}, function(options){
            _this.options.api = options.api;
            _this.options.apitype = options.apitype;
            _this.options.jsonpath = options.jsonpath;
        })
        // Restoring cached values.
        chrome.storage.local.get(null, (cachedValues): void => {
            const currentTime = Date.now()
            for (const userkey in cachedValues) {
                const { data, created } = cachedValues[userkey];
                if (created + this.chromeStorageExpiry > currentTime) {
                    this.userMap.set(userkey, Promise.resolve(new User(data.user)))
                }
            }
        })
    }

    public async getUser(id: string, root: string): Promise<User> {
        const userKey = `${id}-${root}`
        if (!this.userMap.has(userKey)) {
            this.userMap.set(userKey, this.getUserFromOA(id, root).then((user): User => {
                if ((user.getName() + '').trim().length) {
                    chrome.storage.local.set({
                        [userKey]: {
                            created: Date.now(),
                            data: user
                        }
                    })
                }
                return user
            }))
        }
        return this.userMap.get(userKey) as Promise<User>
    }

    private async readOptions() {
        var options = new Promise<Options>(function(resolve, reject){
            chrome.storage.sync.get({"api": '', "apitype": 'plain', "jsonpath": ''}, function(options){
                let _options = {
                    api: options.api,
                    apitype: options.apitype,
                    jsonpath: options.jsonpath,
                }
                resolve(_options);
            })
        });

        this.options = await options
        // console.log(this.api);
    }
    public async getUserFromOA(id: string, root: string): Promise<User> {
        let data: GitHubUser = {
            id: id,
            name: id
        }
        if (this.options.api.length==0) {
          await this.readOptions()
        }
        try {
            const response = await fetch(`${this.options.api}${id}`, {
                method: "GET",
                cache: "force-cache"
            })
            const responseText = await response.text()
            if (this.options.apitype == 'json') {
                // TODO
                const result = JSONPath({path: this.options.jsonpath, json: JSON.parse(responseText)})
                if (result.length>0) {
                    data.name = result
                }
            } else {
                const result = responseText.replace(/"/g,"")
                if (result.length>0) {
                    data.name = result
                }
            }
        } catch (e) {
            console.log(e)
            console.error(`Could not get user ${id}`)
            console.log(this.options.api + id)
        }
        return new User(data)
    }

    public async getUserFromGitHub(id: string, root: string): Promise<User> {
        let data: GitHubUser = {
            id: id,
            name: id
        }
        try {
            const response = await fetch(`https://${root}/${id}`)
            const responseText = await response.text()
            const searchRegex = new RegExp(`<title>${id} \\((.*)\\)<\\/title>`, "g")
            const match = searchRegex.exec(responseText)
            if (match) {
                // remove UserID from name, if it contains it.
                const fixedName = match[1].replace(id, "").trim()
                data.name = fixedName || data.name
            }
        } catch (e) {
            console.log(e)
            console.error(`Could not get user ${id}`)
        }
        return new User(data)
    }
}

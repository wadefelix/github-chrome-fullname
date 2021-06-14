import { resolve } from "dns"
import "isomorphic-fetch"

interface GitHubUser {
    id: string;
    name: string;
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
    private api: string


    public constructor() {
        this.userMap = new Map()
        this.api = ''
        let _this = this

        chrome.storage.sync.get({"api": ''}, function(options){
            _this.api = options.api
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
        var p = new Promise<string>(function(resolve, reject){
            chrome.storage.sync.get({"api": ''}, function(options){
                resolve(options.api);
            })
        });

        this.api = await p
        // console.log(this.api);
    }
    public async getUserFromOA(id: string, root: string): Promise<User> {
        let data: GitHubUser = {
            id: id,
            name: id
        }
        if (this.api.length==0) {
            await this.readOptions()
        }
        try {
            const response = await fetch(`${this.api}${id}`, {
                method: "GET",
                cache: "force-cache"
            })
            const responseText = await response.text()
            const match = responseText.replace(/"/g,"")
            if (match.length>0) {
                data.name = match
            }
        } catch (e) {
            console.log(e)
            console.error(`Could not get user ${id}`)
            console.log(this.api+id)
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

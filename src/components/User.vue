<template>
  <div>
    <div v-if="state == -1">
        <div class="user" v-for="(user, i) in users" :key="i" >
            <h3>{{user.username}}</h3>
            <button v-on:click="Login(user.id)">Login</button>
            <br>
        </div>
    </div>

    <div v-if="state == 0">
        <form @submit.prevent="createUser">
            <input placeholder="username..." v-model="tmpusername" type="text">
            <input placeholder="Email..." v-model="tmpEmail" type="text">
            <input type="submit" value="Submit">
        </form>
        <button v-on:click="state = 1">Back</button>
    </div>

    <div v-if="state == 1">
        <h2>My profile:</h2>
        <p>{{username}}</p>
        <p>{{email}}</p>
        <br>
        <h2>My Friends:</h2>

        <div class="friend" v-for="(friend, i) in myfriends" :key="i">
            <p>{{friend.username}}</p>
            <p>{{friend.connected}}</p>
            <div v-if="!inRoomWith.includes(friend.id)">
                <div v-if="friend.invite != true">
                    <button v-on:click="InviteUser(friend.id)">Invite</button>
                </div>
                <div v-if="friend.invite == true">
                    <button v-on:click="JoinRoom(friend.id)">Accept Invite</button>
                </div>
            </div>
            <button v-on:click="RemoveFriend(friend.id)">Remove Friend</button>
            <br>
        </div>

        <br>

        <div v-if="inRoom">
            <ul>
                <li v-for="(message, i) in messages" :key="i">
                    <b>{{ message.from }}:</b> {{ message.message }}
                </li>
            </ul>

            <form @submit.prevent="sendMessage">
                <input type="text" placeholder="Message" v-model="newMessage">
                <input type="submit" value="Send">
            </form>

            <button v-on:click="LeaveRoom ()">Disconnect</button>
        </div>


        <br>
        <br>
        <button v-on:click="state = 2">Add New Friend</button>
        <button v-on:click="state = 0">Add New User</button>
        <button v-on:click="state = 3">Remove Player</button>
        <br>
        <button v-on:click="state = -1">Logout</button>
    </div>


    <div v-if="state == 2">
        <div class="user" v-for="(user, i) in users" :key="i" >
            <h3>{{user.username}}</h3>
            <p>{{user.email}}</p>
            <button v-on:click="AddFriend(user.id)">Add Friend</button>
            <br>
        </div>
        <button v-on:click="state = 1">Back</button>
    </div>


    <div v-if="state == 3">
        <div class="user" v-for="(user, i) in users" :key="i" >
            <h3>{{user.username}}</h3>
            <p>{{user.email}}</p>
            <button v-on:click="RemoveUser(user.id)">Remove User</button>
            <br>
        </div>
            <br>
            <button v-on:click="state = 1">Back</button>
    </div>
    <br>

    </div>    
</template>

<script>
import socket from "../socket"

export default {
    components: {
    },
    data () {
        return {
            state: -1,
            inRoom: false,
            inRoomWith: [],

            id: "",
            username: "",
            email: "",   
            friendsIds: [],  
            myfriends: [],

            check: 0,
            tmpId: "",
            tmpusername: "",
            tmpEmail: "",
            tmpFriendList: [],
            
            users: [],
            onlineUsers: [],

            newMessage: "",
            messages:[],

        }
    },
    methods: {
        async createUser(){
            const json = JSON.stringify({   username: this.tmpusername, 
                                            email: this.tmpEmail, 
                                            friendIds: this.tmpFriendList})

            const res = await this.$axios.post("/create", json); 
            if (res.status == 200){
                this.state = 1;
                this.getAllUsers();
            }
        },
        async getAllUsers() {
            const res = await this.$axios.get("/all")
            if (res.status == 200){
                this.users = res.data;
            }
        },
        async Login(id){
            const res = await this.$axios.get("/"+id)
            if (res.status == 200){
                this.id = res.data.id;
                this.username = res.data.username;
                this.email = res.data.email;
                this.friendsIds = res.data.friendsIds;

                socket.auth = {"username": this.username,"id": this.id};
                socket.connect();

                this.getMyFriends();
                this.state = 1
            }
        },
        async getMyFriends(){
            const res = await this.$axios.get("/friends/"+this.id)
            if (res.status == 200){
                this.myfriends = res.data;
            }
        },
        async AddFriend(id){
            const json = JSON.stringify([this.id, id])
            const res = await this.$axios.put("/friends/add", json,  {headers: {'Content-Type': 'application/json'}})
            if (res.status == 200){
                this.state = 1;
                this.getMyFriends();
            }
        },
        async RemoveFriend(id){
            const json = JSON.stringify([this.id, id])
            const res = await this.$axios.put("/friends/remove", json,  {headers: {'Content-Type': 'application/json'}})
            if (res.status == 200){
                this.state = 1;
                this.getMyFriends();
            }
        },
        async RemoveUser(id){
            if(this.id != id){
                const res = await this.$axios.delete("/delete/"+id)
                if (res.status == 200){
                    this.getAllUsers();
                    this.getMyFriends();
                }
            }
        },
        InviteUser (id) {
            socket.emit("invite", id)
        },
        JoinRoom (id) {
            socket.emit("accept invite", id)
            this.myfriends.forEach( friend => {
                friend.invite = false
            })
            console.log(this.myfriends)
        },
        LeaveRoom () {
            this.inRoom = false;
            this.inRoomWith = []
            this.myfriends.forEach(friend => {
                friend.invite = false;
            })
            socket.emit("room disconnect");
        },
        sendMessage () {
            socket.emit("room message", this.newMessage)
            this.newMessage = "";
        },
    },
    mounted () {
        this.getAllUsers();
    },
    created() {
        socket.on("connect_error", (err) => {
        if (err.message === "invalid username") {
            this.usernameAlreadySelected = false;
        }});

        socket.on("connect", () => {
            this.onlineUsers.forEach((user) => {
                if (user.self) {
                    user.connected = true;
        }})});

        socket.on("disconnect", () => {
            this.onlineUsers.forEach((user) => {
                if (user.self) {
                user.connected = false;
        }})});

        socket.on("user connected", (user) => {
            this.onlineUsers.push(user);
        });

        socket.on("user disconnected", (id) => {
        for (let i = 0; i < this.onlineUsers.length; i++) {
            const user = this.onlineUsers[i];
            if (user.userID === id) {
                user.connected = false;
                break;
        }}});

        socket.on("invite", ({ from }) => {
            this.myfriends.forEach(friend => {
                if (friend.id == from){
                    friend.invite = true;
                }
                else
                    friend.invite = false;
        })})

        socket.on("room message", (data) => {
            this.messages.push(data)
        })

        socket.on("room connect", data =>{
            if(data != this.id)
                this.inRoomWith.push(data)
        })

        socket.on("room disconnect", data => {
            var index = this.inRoomWith.indexOf(data);
            if (index !== -1) {
                this.inRoomWith.splice(index, 1);
            }
            if (this.inRoomWith.length == 0 ){ 
                this.LeaveRoom ();
            }
        })

        socket.on("accept invite", data => {
            socket.emit("join room", data)
            this.inRoom = true
        })
    },
    unmounted() {
        socket.off("connect_error");
    },
}
</script>



<style>
*{
    text-align: left;
}
</style>
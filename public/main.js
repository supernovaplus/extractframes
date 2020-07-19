Vue.component('video-list-page', {
    data: function(){ 
        return {
            fileList: [],
            fileCount: 0,
            currentFileListPage: 1,
            nextPage: null,
            maxPage: null,
            error: null
    }},
    methods: {
        fetchList(pageid = 1){
            if(!pageid || pageid < 1 && pageid > this.maxPage) return;

            fetch("videos.json?page="+pageid).then(res=>res.json()).then(res=>{
                if(res && res.status === 200 && res.files.length > 0){
                    this.fileList = res.files;
                    this.fileCount = res.fileCount;
                    this.currentFileListPage = res.pages.currentPage;
                    this.nextPage = res.pages.nextPage;
                    this.maxPage = res.pages.maxPage;
                }else{
                    this.data.errors = "Error #1";
                }
            }).catch(err=>{
                this.data.errors = "Error #2"; 
                console.log(err);
            })
        },
        playVideo(url){
            console.log(videoPlayer)
            videoPlayer.src = "videos/"+url;
            
            videoPlayer.onloadeddata = function() {
                videoPlayer.currentTime = (videoPlayer.duration * 0.25);
                videoPlayer.play();
            };

        }
    },
    beforeDestroy: function () {
    },
    created: function(){
        this.fetchList(1);
    },
    mounted: function(){
        videoPlayer.volume = 0.1;
    },
    template: `<div>
    <video width="1024" height="720" controls id="videoPlayer" type="video/mp4" loop></video>
    <page-change-block @fetchList="fetchList" v-bind:props="{currentFileListPage, nextPage, maxPage, fileCount}"/>
    <h2 v-if="error">Problem: {{error}}</h2>
    <ul id="itemsList">
        <li v-for="(file, index) in this.fileList" :key="index">
            <div>{{file.subfolder + file.name}}</div>
            <div class="img" :style="{ backgroundImage: \`url('screenshots/\${ file.name }.jpg')\`}" v-on:click="playVideo(file.subfolder + file.name)"></div>
        </li>
    </ul>
    <page-change-block @fetchList="fetchList" v-bind:props="{currentFileListPage, nextPage, maxPage, fileCount}"/>
    </div>
     `
});


Vue.component('page-change-block', {
    props: ["props"],
    methods:{
        emit: function(value){
            this.$emit("fetchList", +value);
        }
    },
    template: `<div>
        Total Files: {{ this.props.fileCount }} | Current Page: {{ this.props.currentFileListPage }}/{{ this.props.maxPage }}
        <input type="button" value="Back" v-on:click="() => emit(this.props.currentFileListPage - 1)" :disabled="this.props.currentFileListPage <= 1">
        <input type="button" value="Next" v-on:click="() => emit(this.props.nextPage)" :disabled="!this.props.nextPage">
        <input type="number" v-on:keyup.enter="(e) => emit(+e.target.value)" :placeholder="'Max Page: '+this.props.maxPage" :max="this.props.maxPage">
    </div>`
});

Vue.component('home-page', {
    template: `<div>
    Home
    </div>`
});

Vue.component('file-scanner', {
    data: function(){
        return {
            interval: null,
            scanInProgress: true,
            message: "Not started",
            progress: 0
        }
    },
    methods:{
        checkProgress(initializeScan = false){
            fetch("scanning.json" + (initializeScan ? "?start" : "")).then(res=>res.json()).then(res=>{
                if(res.scanstatus === 0 || res.scanstatus === 1){
                    if(!this.interval){
                        this.interval = setInterval(()=>{
                            this.checkProgress();
                        },2000);
                    }
                    this.scanInProgress = true;
                    this.message = res.message;
                    this.progress = res.progress || -1;
                }else{
                    if(this.interval){
                        clearInterval(this.interval);
                        this.interval = null;
                    }
                    this.scanInProgress = false;
                    this.message = res.message;
                }
            }).catch(err=>{
                console.log(err)
                this.message = "error";
            })
        },
    },
    mounted: function(){
        this.checkProgress();
    },
    beforeDestroy: function(){
        if(this.interval) clearInterval(this.interval);
    },
    template: `<div>
    <input type="button" value="start scanning" v-on:click="checkProgress(true);" :disabled="this.scanInProgress">
    {{this.message}} | {{this.progress}}
    </div>`
});

Vue.component('demo-page-two', {
    template: `<div>
    demo-page-two
    </div>`
});


const app = new Vue({
    el: '#app',
    data: {
        links: [
            {name: "Home", id: 0},
            {name: "Video List", id: 1},
            {name: "Folder Scanner", id: 2},
            {name: "Page 3", id: 3}
        ],
        currentContentPage: 0
    },
    methods: {
        selectPage(pageid){
            this.currentContentPage = pageid;
        }
    },

    template: `<div>
        <div id="links">
            <a v-for="(link, index) in this.links" :key="index" v-on:click="selectPage(link.id)" href="#">#{{ link.name }}</a>
        </div>
        <div>
            <home-page v-if="currentContentPage === 0"/>
            <video-list-page v-if="currentContentPage === 1"/>
            <file-scanner v-else-if="currentContentPage === 2"/>
            <demo-page-two v-else-if="currentContentPage === 3"/>
        </div>
    </div>`
})

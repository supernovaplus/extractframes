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

            fetch("items.json?page="+pageid).then(res=>res.json()).then(res=>{
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
            videoPlayer.play();
            videoPlayer.currentTime = 100;
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
    <video width="1024" height="720" controls id="videoPlayer"></video>
    <page-change-block @fetchList="fetchList" v-bind:props="{currentFileListPage, nextPage, maxPage, fileCount}"/>
    <h2 v-if="error">Problem: {{error}}</h2>
    <ul id="itemsList">
        <li v-for="(file, index) in this.fileList" :key="index">
            <div>{{file.dir + '/' +file.name}}</div>
            <div class="img" :style="{ backgroundImage: \`url('screenshots/\${ file.name }.jpg')\`}" v-on:click="playVideo(file.dir+'/'+file.name)"></div>
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
        Total Files: {{ this.props.fileCount }} | Current Page: {{ this.props.currentFileListPage }}
        <input type="button" value="Back" v-on:click="() => emit(this.props.currentFileListPage - 1)" :disabled="this.props.currentFileListPage <= 1">
        <input type="button" value="Next" v-on:click="() => emit(this.props.nextPage)" :disabled="!this.props.nextPage">
        <input type="number" v-on:keyup.enter="(e) => emit(+e.target.value)" :placeholder="'Max Page: '+this.props.maxPage" :max="this.props.maxPage">
    </div>`
});

Vue.component('navigate-page', {
    data: function(){
        return {
            links: [
                {name: "Files", id: 0},
                {name: "Page 2", id: 1},
                {name: "Page 3", id: 2}
            ]
        };
    },
    props: ["props"],
    methods:{
        emitPage(pageid){
            this.$emit("selectPage", pageid)
        }
    },
    template: `<div>
        <a v-for="(link, index) in this.links" :key="index" v-on:click="emitPage(link.id)" href="#">- {{ link.name }}</a>
    </div>`
});

Vue.component('demo-age', {
    template: `<div>
        demo page 2
    </div>`
});
Vue.component('demo-agedva', {
    template: `<div>
        demo page 3
    </div>`
});


const app = new Vue({
    el: '#app',
    data: {
        contentPage: 1
    },
    methods: {
        selectPage(pageid){
            this.contentPage = pageid;
        }
    },

    template: `<div>
        <navigate-page @selectPage="selectPage" v-bind:props="{contentPage}"/>
        <div>
            <video-list-page v-if="contentPage === 0"/>
            <demo-age v-if="contentPage === 1"/>
            <demo-agedva v-if="contentPage === 2"/>
        </div>
    </div>`
})

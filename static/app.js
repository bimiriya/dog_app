$(document).ready(() => {
    dog_app.init()
})

function Page() {
    var self = this;
    self.pagination = 10;
    self.current = ko.observable(1)
    self.page_data = ko.observable([])
}

function Search(selected_breed) {
    var self = this;
    self.page = new Page()
    self.selected_breed = selected_breed
    self.page_data = ko.observableArray([])
    self.unfilter = []
    self.unfilter_search = function(sub_breed) {
        var breed = self.unfilter.push(sub_breed)
        self.api_call()
    }
    self.urls = function() {
        var breed = self.selected_breed
        var unfilter = self.unfilter
        if (breed.sub_breeds.length > 0) {
            var urls = breed.sub_breeds.map((sub_breed) => {
                if (unfilter.includes(sub_breed) == false) {
                    return `https://dog.ceo/api/breed/${breed.name()}/${sub_breed}/images`
                }
            })
            
        } else {
            var urls = [`https://dog.ceo/api/breed/${breed.name()}/images`]
        }
        return urls
    }
    self.search_data = ko.observableArray([])
    self.api_call = function() {
        var urls = self.urls()
        for (var i in urls) {
            $.get(urls[i])
            .done((data) => {
                var response = data['message']
                for (var x in response) {
                    self.search_data.push(response[x])
                }
            })
            .then(() => {
                var start = self.page.pagination * (self.page.current()-1)
                var end = self.page.pagination * self.page.current()
                self.page_data(self.search_data().slice(start,end))
            })
            
        }

    }
    self.next_page = function() {
        var current = self.page.current()
        self.page.current(current+1)
        self.api_call()
    }
    self.prev_page = function() {
        var current = self.page.current()
        if (current > 1) {
            self.page.current(current-1)
            self.api_call()
        }
    }
}

function Breed(name,sub_breeds) {
    var self = this;
    self.name = ko.observable(name);
    self.sub_breeds = sub_breeds
}


function DogApp() {
    var self = this;
    self.input = document.getElementById('breed-filter')
    self.selected_breed = ko.observable(null)
    self.breeds = ko.observableArray()
    self.awesomplete = null
    self.init = function() {
        $.get('https://dog.ceo/api/breeds/list/all')
        .done((data) => {
            var breed_data = data['message']
            var breed_list = Object.keys(breed_data)

            self.fill_awesomplete(breed_list)
            self.fill_breeds(breed_data,breed_list)

        })
    }

    self.fill_awesomplete = function(list) {
        self.awesomplete =  new Awesomplete(self.input,
            {
                list:list,
                minChars:1
            }
        )
    }

    self.fill_breeds = function(data,list) {
        var breeds = list.map((breed) => {
            var sub_breeds = data[breed]
            return new Breed(breed,sub_breeds)
        })
        self.breeds(breeds)
    }

    self.input.addEventListener("awesomplete-selectcomplete", function(event) {
        var breed = self.input.value
        var match = ko.utils.arrayFirst(self.breeds(), function(item) {
            return item.name() == breed;
        });
        self.selected_breed(match)
        self.perform_search(null,self.selected_breed())
        self.input.value = ''
    });
    self.perform_search = function(sub_breed,selected_breed) {
        var new_search = new Search(selected_breed)
        new_search.api_call(sub_breed)
        self.searches.push(new_search)
    }
   
    self.searches = ko.observableArray([])
    self.remove_search = function(item) {
        self.searches.remove(item)
    }

}
var dog_app = new DogApp()
ko.applyBindings(dog_app)
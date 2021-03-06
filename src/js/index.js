'use strict';

let DragManager = require('./dnd');
require('../style/app.scss');

let friendsFilter = (function () {
    let friends = localStorage.friends,
        friendsList = localStorage.friendsList,
        filterLeft = '',
        filterRight = '',
        searchLeftInput = document.querySelector('#search-left-input'),
        searchRightInput = document.querySelector('#search-right-input'),
        friendsLeftList = document.querySelector('#friends-left-list'),
        friendsRightList = document.querySelector('#friends-right-list'),
        buttonSave = document.querySelector('#button-save'),
        modalClose = document.querySelector('#modal-close'),
        logo = document.querySelector('#logo');

    let login = () => {
        return new Promise((resolve, reject) => {
            VK.init({
                apiId: 5919316
            });

            VK.Auth.login(response => {
                if (response.status == 'connected') {
                    resolve(response);
                } else {
                    reject(new Error('Не удалось авторизоваться'));
                }
            }, 2);
        });
    };

    let callApi = (method, params) => {
        return new Promise((resolve, reject) => {
            VK.api(method, params, result => {
                if (result.error) {
                    reject(new Error('Не удалось вызвать метод API: ' + method));
                } else {
                    resolve(result.response)
                }
            });
        });
    };

    let getFriends = () => {
        return new Promise((resolve) => {
            if (friends) {
                friends = JSON.parse(friends);
                friendsList = JSON.parse(friendsList);
                resolve();
            } else {
                callApi('friends.get', {v: '5.62', fields: 'photo_50'})
                    .then(response => {
                        friends = [];
                        friendsList = [];
                        response.items.forEach((item) => {
                            let o = {};

                            ({
                                id: o.id,
                                first_name: o.first_name,
                                last_name: o.last_name,
                                photo_50: o.photo_50
                            } = item);
                            friends.push(o);
                        });
                        resolve();
                    });
            }
        });
    };

    let addFriendsToHTML = (elems, templateName, filter) => {
        let template = require(`../template/blocks/${templateName}.hbs`);

        return template({
            friends: elems.filter((item) => {
                return isMatching(item.first_name, filter) || isMatching(item.last_name, filter);
            })
        });
    };

    let isMatching = (full, chunk) => {
        return !!~full.toLowerCase().indexOf(chunk.toLowerCase());
    };

    let moveFriend = (elem, dir = 'to') => {
        let friend = elem.closest('.friend');
        let id = friend.dataset.id;

        if (dir == 'to') {
            let f = friends.filter((item) => {
                return item.id == id;
            })[0];

            friendsList.push(f);
            friends = friends.filter((item) => {
                return item.id != id;
            });
        } else {
            let f = friendsList.filter((item) => {
                return item.id == id;
            })[0];

            friends.push(f);
            friendsList = friendsList.filter((item) => {
                return item.id != id;
            });
        }

        friendsLeftList.innerHTML = addFriendsToHTML(friends, 'friends', filterLeft);
        friendsRightList.innerHTML = addFriendsToHTML(friendsList, 'friends-list', filterRight);
    };

    return {
        init: function () {
            login()
                .then(() => {
                    return getFriends();
                })
                .then(() => {
                    friendsLeftList.innerHTML = addFriendsToHTML(friends, 'friends', filterLeft);
                    friendsRightList.innerHTML = addFriendsToHTML(friendsList, 'friends-list', filterRight);

                    searchLeftInput.addEventListener('keyup', function () {
                        filterLeft = this.value.trim();
                        friendsLeftList.innerHTML = addFriendsToHTML(friends, 'friends', filterLeft);
                    });

                    searchRightInput.addEventListener('keyup', function () {
                        filterRight = this.value.trim();
                        friendsRightList.innerHTML = addFriendsToHTML(friendsList, 'friends-list', filterRight);
                    });

                    buttonSave.addEventListener('click', () => {
                        localStorage.friends = JSON.stringify(friends);
                        localStorage.friendsList = JSON.stringify(friendsList);
                        alert('Сохранено!');
                    });

                    modalClose.addEventListener('click', () => {
                        document.querySelector('.modal').style.display = 'none';
                    });

                    logo.addEventListener('click', () => {
                        document.querySelector('.modal').style.display = 'block';
                    });

                    friendsLeftList.addEventListener('click', (e) => {
                        if (e.target.classList.contains('friend__action')) {
                            moveFriend(e.target, 'to');
                        }
                    });

                    friendsRightList.addEventListener('click', (e) => {
                        if (e.target.classList.contains('friend__action')) {
                            moveFriend(e.target, 'from');
                        }
                    });

                    DragManager.onDragCancel = dragObject => dragObject.avatar.rollback();
                    DragManager.onDragEnd = (dragObject) => {
                        document.body.removeChild(dragObject.avatar);
                        moveFriend(dragObject.elem, 'to');
                    };
                })
                .catch(error => console.log(error));
        }
    }
})();

window.addEventListener('load', () => {
    friendsFilter.init();
});

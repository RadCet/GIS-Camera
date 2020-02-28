export const renderInfoWindowContent = (info) => {
    let html = ['<div class="MiniPopup">'];
    html.push('<span class="Title" title="' + info.title + '">' + info.title + '</span>');
    html.push('<br>');
    html.push('<p class="Content">');

    if (info.address) {
        html.push('<span class="address" title="' + info.address + '">' + info.address + '</span>');
    }

    if (info.contact) {
        html.push('<span class="phone">' + info.contact + '</span>');
    }


    if(info.events) {
        try {
            let eventsObj = info.events.sort((e1, e2) => e2.from - e1.from);//JSON.parse(info.events);
            let count = 0;
            eventsObj.map(event => {
                let eventDataType='video';
                if(event.dataType && event.dataType!='') {
                    eventDataType = event.dataType;
                }
                if (++count <= 3) {
                    const from = new Date(event.from);
                    html.push('<span class="event" title="' + from.toLocaleDateString() + '">' + from.toLocaleTimeString() + ': <a class="aEvent" data-clusterdataid="' + info.clusterDataID + '" data-eventid="' + event.id + '" data-camid="' + info.vmsCamId + '" data-eventfrom="' + event.from + '" data-camname="' + info.title + '" data-type="' + event.type + '" data-time="' + from.toLocaleString() + '">' + event.type + '</a></span>');
                }
            });
        }
        catch (e) {
        }
    }

    if (info.username && info.password) {
        html.push('<span class="username">Tài khoản: ' + info.username + '</span>');
        html.push('<span class="password">Mật khẩu: ' + info.password + '</span>');
    }
    if (info.numberChilds) {
        html.push('<span class="username">Tổng số camera: ' + info.numberChilds + '</span>');
    }
    /*if (info.detailUrl) {
        html.push('<a class="website" target="_blank" href="' + info.detailUrl + '">Xem đầy đủ</a>');
    }*/

    html.push('</p>');

    html.push('</div>');
    return html.join('');
}

const CONFIG = {
    LIFF_ID: '2005615503-8JAEqGMn',
    API_URL: 'https://script.google.com/macros/s/AKfycbxWZIaAE2GIlNIfgZepGOyAfWkiCfX3OgIoUzmEpQ34RO-RSbQ_QH_1EcYF4h5hMy271A/exec',
    ITEMS_PER_PAGE: 10
};

// LIFF initialization function
async function initializeLIFF() {
    try {
        await liff.init({ liffId: CONFIG.LIFF_ID });
        if (!liff.isLoggedIn()) {
            liff.login();
        }
    } catch (error) {
        console.error('LIFF initialization failed', error);
        showNotification('LIFF initialization failed: ' + error.message, false);
    }
}

// Show notification function (example implementation)
function showNotification(message, isSuccess) {
    const notification = document.createElement('div');
    notification.textContent = message;
    notification.style.backgroundColor = isSuccess ? '#38A169' : '#E53E3E';
    notification.style.color = '#fff';
    notification.style.padding = '10px';
    notification.style.margin = '10px';
    notification.style.borderRadius = '5px';
    document.body.appendChild(notification);

    setTimeout(() => {
        notification.remove();
    }, 3000);
}

// Share function
async function shareToLine(rowData) {
    if (!liff.isInClient() && !liff.isLoggedIn()) {
        showNotification('กรุณาเข้าสู่ระบบ LINE ก่อน', false);
        return;
    }

    try {
        const currentDate = new Date().toLocaleString('th-TH', {
            timeZone: 'Asia/Bangkok',
            year: 'numeric',
            month: 'long',
            day: 'numeric',
            hour: '2-digit',
            minute: '2-digit',
            hour12: false
        });

        const message = {
            type: "flex",
            altText: "ข้อมูลการเบิกสินค้า",
            contents: {
                type: "bubble",
                size: "mega",
                header: {
                    type: "box",
                    layout: "vertical",
                    contents: [
                        {
                            type: "text",
                            text: "รายการเบิกสินค้า",
                            weight: "bold",
                            size: "xl",
                            color: "#ffffff",
                            align: "center"
                        }
                    ],
                    backgroundColor: "#2563EB",
                    paddingAll: "20px"
                },
                body: {
                    type: "box",
                    layout: "vertical",
                    contents: [
                        {
                            type: "box",
                            layout: "vertical",
                            spacing: "sm",
                            contents: [
                                {
                                    type: "box",
                                    layout: "horizontal",
                                    contents: [
                                        {
                                            type: "text",
                                            text: "ชื่อ-สกุล",
                                            size: "sm",
                                            color: "#aaaaaa",
                                            flex: 2
                                        },
                                        {
                                            type: "text",
                                            text: rowData.NAME || '-',
                                            size: "sm",
                                            color: "#666666",
                                            flex: 4,
                                            wrap: true
                                        }
                                    ]
                                },
                                {
                                    type: "separator",
                                    margin: "10px"
                                },
                                {
                                    type: "box",
                                    layout: "horizontal",
                                    contents: [
                                        {
                                            type: "text",
                                            text: "ยอดเบิก",
                                            size: "sm",
                                            color: "#aaaaaa",
                                            flex: 2
                                        },
                                        {
                                            type: "text",
                                            text: rowData.เบิก || '0',
                                            size: "sm",
                                            color: "#E53E3E",
                                            flex: 4,
                                            wrap: true,
                                            weight: "bold"
                                        }
                                    ]
                                },
                                {
                                    type: "separator",
                                    margin: "10px"
                                },
                                {
                                    type: "box",
                                    layout: "horizontal",
                                    contents: [
                                        {
                                            type: "text",
                                            text: "ยอดคืน",
                                            size: "sm",
                                            color: "#aaaaaa",
                                            flex: 2
                                        },
                                        {
                                            type: "text",
                                            text: rowData.คืน || '0',
                                            size: "sm",
                                            color: "#38A169",
                                            flex: 4,
                                            wrap: true,
                                            weight: "bold"
                                        }
                                    ]
                                },
                                {
                                    type: "separator",
                                    margin: "10px"
                                },
                                {
                                    type: "box",
                                    layout: "horizontal",
                                    contents: [
                                        {
                                            type: "text",
                                            text: "ยอดค้าง",
                                            size: "sm",
                                            color: "#aaaaaa",
                                            flex: 2
                                        },
                                        {
                                            type: "text",
                                            text: rowData.ค้าง || '0',
                                            size: "sm",
                                            color: "#DD6B20",
                                            flex: 4,
                                            wrap: true,
                                            weight: "bold"
                                        }
                                    ]
                                }
                            ]
                        }
                    ],
                    paddingAll: "20px"
                },
                footer: {
                    type: "box",
                    layout: "vertical",
                    contents: [
                        {
                            type: "button",
                            style: "primary",
                            action: {
                                type: "uri",
                                label: "ดูข้อมูลเพิ่มเติม",
                                uri: rowData.Link || "https://example.com"
                            },
                            color: "#2563EB"
                        }
                    ],
                    paddingAll: "20px"
                },
                styles: {
                    footer: {
                        separator: true
                    }
                }
            }
        };

        await liff.shareTargetPicker([message]);
        showNotification('แชร์ข้อมูลสำเร็จ', true);
    } catch (error) {
        console.error('Share failed', error);
        showNotification('แชร์ข้อมูลไม่สำเร็จ: ' + error.message, false);
    }
}

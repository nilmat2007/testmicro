// Configuration constants
const CONFIG = {
    LIFF_ID: '2005615503-8JAEqGMn',
    API_URL: 'https://script.google.com/macros/s/AKfycbxWZIaAE2GIlNIfgZepGOyAfWkiCfX3OgIoUzmEpQ34RO-RSbQ_QH_1EcYF4h5hMy271A/exec',
    ITEMS_PER_PAGE: 10,
    MAX_RETRIES: 3,
    TIMEOUT: 10000
};

// Improved LIFF initialization with retry mechanism
async function initializeLIFF(retries = 0) {
    try {
        await Promise.race([
            liff.init({ liffId: CONFIG.LIFF_ID }),
            new Promise((_, reject) => 
                setTimeout(() => reject(new Error('LIFF initialization timeout')), CONFIG.TIMEOUT)
            )
        ]);

        if (!liff.isLoggedIn()) {
            liff.login();
        }
    } catch (error) {
        console.error('LIFF initialization failed:', error);
        
        if (retries < CONFIG.MAX_RETRIES) {
            console.log(`Retrying LIFF initialization (${retries + 1}/${CONFIG.MAX_RETRIES})`);
            await new Promise(resolve => setTimeout(resolve, 1000));
            return initializeLIFF(retries + 1);
        }
        
        showNotification('ไม่สามารถเชื่อมต่อกับ LINE ได้ กรุณาลองใหม่อีกครั้ง', false);
        throw error;
    }
}

// Improved share function with error handling
async function shareToLine(rowData) {
    if (!liff.isInClient() && !liff.isLoggedIn()) {
        showNotification('กรุณาเข้าสู่ระบบ LINE ก่อน', false);
        return;
    }

    try {
        // Validate required data
        if (!rowData || !rowData.NAME) {
            throw new Error('ข้อมูลไม่ถูกต้องหรือไม่ครบถ้วน');
        }

        const message = createFlexMessage(rowData);
        await liff.shareTargetPicker([message]);
        showNotification('แชร์ข้อมูลสำเร็จ', true);
    } catch (error) {
        console.error('Share failed:', error);
        showNotification('ไม่สามารถแชร์ข้อมูลได้: ' + error.message, false);
        throw error;
    }
}

// Helper function to create Flex Message
function createFlexMessage(rowData) {
    const currentDate = new Date().toLocaleString('th-TH', {
        timeZone: 'Asia/Bangkok',
        year: 'numeric',
        month: 'long',
        day: 'numeric',
        hour: '2-digit',
        minute: '2-digit',
        hour12: false
    });

    return {
        type: "flex",
        altText: "ข้อมูลการเบิกสินค้า",
        contents: {
            type: "bubble",
            size: "mega",
            header: {
                type: "box",
                layout: "vertical",
                contents: [{
                    type: "text",
                    text: "รายการเบิกสินค้า",
                    weight: "bold",
                    size: "xl",
                    color: "#ffffff",
                    align: "center"
                }],
                backgroundColor: "#2563EB",
                paddingAll: "20px"
            },
            body: createFlexMessageBody(rowData, currentDate),
            footer: createFlexMessageFooter(rowData)
        }
    };
}

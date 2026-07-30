// --- ENTRY POINT ---
window.onload = function () {
    if (typeof renderCampaignSelector === 'function') renderCampaignSelector();
    if (typeof updateResourceUI === 'function') updateResourceUI();
};

function switchTab(tabId) {
    document.querySelectorAll('.tab-btn').forEach(btn => btn.classList.remove('active'));
    document.querySelectorAll('.tab-content').forEach(content => content.classList.remove('active'));

    const targetTab = document.getElementById(tabId);
    if (targetTab) targetTab.classList.add('active');

    const targetBtn = Array.from(document.querySelectorAll('.tab-btn')).find(btn => 
        btn.getAttribute('onclick') && btn.getAttribute('onclick').includes(`'${tabId}'`)
    );
    if (targetBtn) targetBtn.classList.add('active');

    // Kích hoạt các hàm render tương ứng
    if (tabId === 'roster-tab' && typeof renderRoster === 'function') renderRoster();
    if (tabId === 'merge-tab' && typeof updateMergeUI === 'function') updateMergeUI();
    if (tabId === 'campaign-tab' && typeof selectCampaign === 'function') selectCampaign(selectedCampaignId);
    if (tabId === 'shop-tab' && typeof renderShop === 'function') renderShop();
    if (tabId === 'inventory-tab' && typeof renderInventory === 'function') renderInventory();
    if (tabId === 'gym-tab' && typeof updateGymUI === 'function') updateGymUI();
}
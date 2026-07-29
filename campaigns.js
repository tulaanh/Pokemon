const CAMPAIGN_LEVELS = [
    {
        id: 1,
        name: "Cửa 1: Khởi Đầu Hoang Dã",
        description: "Các Pokémon hoang dã cấp thấp thử sức tân thủ.",
        rewardGems: 150,
        rewardExp: 100000,
        enemies: [
            { speciesName: "Rattata", level: 2, rarityName: "Common", statMult: 1.1 },
            { speciesName: "Pidgey", level: 3, rarityName: "Common", statMult: 1.2 }
        ]
    },
    {
        id: 2,
        name: "Cửa 2: Hang Đá Vôi",
        description: "Chạm trán các Pokémon hệ Đá có lượng Máu cực trâu!",
        rewardGems: 250,
        rewardExp: 200,
        enemies: [
            { speciesName: "Geodude", level: 5, rarityName: "Rare", statMult: 1.3 },
            { speciesName: "Geodude", level: 6, rarityName: "Rare", statMult: 1.4 }
        ]
    },
    {
        id: 3,
        name: "Cửa 3: Khu Rậm Rậm",
        description: "Đội hình kết hợp giữa thuộc tính Cỏ và Nước.",
        rewardGems: 350,
        rewardExp: 350,
        enemies: [
            { speciesName: "Bulbasaur", level: 7, rarityName: "Rare", statMult: 1.4 },
            { speciesName: "Squirtle", level: 8, rarityName: "Rare", statMult: 1.5 },
            { speciesName: "Oddish", level: 9, rarityName: "Epic", statMult: 1.6 }
        ]
    },
    {
        id: 4,
        name: "Cửa 4: Thách Thức Hệ Đá & Lửa",
        description: "Đối thủ tăng tốc độ và sát thương cực kỳ nguy hiểm.",
        rewardGems: 500,
        rewardExp: 500,
        enemies: [
            { speciesName: "Charmander", level: 10, rarityName: "Epic", statMult: 1.7 },
            { speciesName: "Onix", level: 12, rarityName: "Epic", statMult: 1.9 },
            { speciesName: "Magmar", level: 13, rarityName: "Legendary", statMult: 2.0 }
        ]
    },
    {
        id: 5,
        name: "Cửa 5: Đền Thờ Cổ Đại (Trùm)",
        description: "Boss Onix Huyền Thoại cùng dàn thuộc hạ siêu trâu bò!",
        rewardGems: 1000,
        rewardExp: 1000,
        enemies: [
            { speciesName: "Machop", level: 14, rarityName: "Epic", statMult: 1.8 },
            { speciesName: "Pikachu", level: 15, rarityName: "Legendary", statMult: 2.2 },
            { speciesName: "Onix", level: 18, rarityName: "Legendary", statMult: 2.8 }
        ]
    }
];
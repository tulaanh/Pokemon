const CAMPAIGN_LEVELS = [
    {
        id: 1,
        name: "Cửa 1: Khởi Đầu Khám Phá",
        description: "Làm quen với cơ chế chiến đấu cơ bản. Đối thủ là các Pokémon cấp thấp có chỉ số cơ bản.",
        rewardGems: 100,
        rewardExp: 50,
        enemies: [
            // Mục đích: Cho tân thủ dễ dàng chiến thắng ngay trận đầu. Hệ Lửa và Nước cơ bản.
            { species: "Fuecoco", level: 1, rarity: "Common", statMult: 1.0 }, //[cite: 12]
            { species: "Mudkip", level: 2, rarity: "Common", statMult: 1.0 }   //[cite: 12]
        ]
    },
    {
        id: 2,
        name: "Cửa 2: Rừng Cây Rậm Rạp",
        description: "Chạm trán hệ Cỏ và Điện. Hãy chú ý đến tốc độ đánh của chúng!",
        rewardGems: 150,
        rewardExp: 100,
        enemies: [
            // Mục đích: Giới thiệu hệ Cỏ và Điện. Bắt đầu có cơ chế tăng MP khởi đầu của Pikachu.
            { species: "Bulbasaur", level: 3, rarity: "Common", statMult: 1.0 }, //[cite: 12]
            { species: "Pikachu", level: 4, rarity: "Common", statMult: 1.0 }    //[cite: 12]
        ]
    },
    {
        id: 3,
        name: "Cửa 3: Sườn Núi Đầy Sỏi Đá",
        description: "Thử thách sát thương của bạn trước lớp giáp dày của hệ Đá.",
        rewardGems: 200,
        rewardExp: 150,
        enemies: [
            // Mục đích: Kiểm tra khả năng gây sát thương (DPS check) của người chơi bằng các Pokémon hệ Đá có máu và giáp tốt.
            { species: "Lycanroc", level: 5, rarity: "Rare", statMult: 1.2 },    //[cite: 12]
            { species: "Aerodactyl", level: 6, rarity: "Rare", statMult: 1.2 }   //[cite: 12]
        ]
    },
    {
        id: 4,
        name: "Cửa 4: Xung Đột Băng Hỏa",
        description: "Đối phó với đội hình có khả năng tự phục hồi và hỏa lực mạnh.",
        rewardGems: 250,
        rewardExp: 200,
        enemies: [
            // Mục đích: Dạy người chơi về sự kết hợp (Synergy). Vaporeon tự hồi phục, Flareon tấn công.
            { species: "Flareon", level: 7, rarity: "Rare", statMult: 1.2 },     //[cite: 12]
            { species: "Vaporeon", level: 8, rarity: "Rare", statMult: 1.2 }     //[cite: 12]
        ]
    },
    {
        id: 5,
        name: "Cửa 5: Thử Thách Của Charizard (Mini-Boss)",
        description: "Băng qua ngọn đồi lửa để chứng minh sức mạnh thực sự!",
        rewardGems: 400,
        rewardExp: 300,
        enemies: [
            // Mục đích: Cột mốc (Mini-Boss) đầu tiên. Yêu cầu người chơi phải có ít nhất 1 Pokémon Epic để vượt qua.
            { species: "Raichu", level: 9, rarity: "Rare", statMult: 1.2 },      //[cite: 12]
            { species: "Charizard", level: 10, rarity: "Epic", statMult: 1.5 }   //[cite: 12]
        ]
    },
    {
        id: 6,
        name: "Cửa 6: Bão Sét Chớp Nhoáng",
        description: "Tốc độ là chìa khóa. Kẻ địch sẽ ra đòn trước nếu bạn quá chậm!",
        rewardGems: 300,
        rewardExp: 250,
        enemies: [
            // Mục đích: Buộc người chơi phải chú ý đến chỉ số Speed (SPD). Đội hình này rất nhanh.
            { species: "Jolteon", level: 11, rarity: "Rare", statMult: 1.2 },    //[cite: 12]
            { species: "Zeraora", level: 12, rarity: "Epic", statMult: 1.5 }     //[cite: 12]
        ]
    },
    {
        id: 7,
        name: "Cửa 7: Vùng Đất Sinh Trưởng",
        description: "Kẻ địch hệ Cỏ có khả năng hồi sinh lực liên tục.",
        rewardGems: 350,
        rewardExp: 300,
        enemies: [
            // Mục đích: Thử thách đội hình sốc sát thương. Nếu không giết nhanh, địch sẽ hồi đầy máu.
            { species: "Celebi", level: 13, rarity: "Epic", statMult: 1.5 },     //[cite: 12]
            { species: "Leafeon", level: 14, rarity: "Epic", statMult: 1.5 }     //[cite: 12]
        ]
    },
    {
        id: 8,
        name: "Cửa 8: Cuồng Phong Đại Dương",
        description: "Lớp khiên và phòng thủ cực mạnh của hệ Nước cản bước tiến của bạn.",
        rewardGems: 400,
        rewardExp: 350,
        enemies: [
            // Mục đích: Cửa ải bào mòn thể lực. Yêu cầu đội hình người chơi phải có sức chống chịu ngang ngửa.
            { species: "Blastoise", level: 15, rarity: "Epic", statMult: 1.5 },  //[cite: 12]
            { species: "Gyarados", level: 16, rarity: "Legendary", statMult: 2.0 } //[cite: 12]
        ]
    },
    {
        id: 9,
        name: "Cửa 9: Bộ Ba Tinh Anh",
        description: "Cuộc đụng độ với những Pokémon có bộ kỹ năng vô cùng tinh quái.",
        rewardGems: 500,
        rewardExp: 450,
        enemies: [
            // Mục đích: Vượt ải khó nhằn trước khi gặp Trùm cuối. Sự pha trộn giữa tốc độ, sát thương và khống chế.
            { species: "Decidueye", level: 16, rarity: "Epic", statMult: 1.5 },       //[cite: 12]
            { species: "Infernape", level: 17, rarity: "Legendary", statMult: 2.0 },  //[cite: 12]
            { species: "Greninja", level: 18, rarity: "Legendary", statMult: 2.0 }    //[cite: 12]
        ]
    },
    {
        id: 10,
        name: "Cửa 10: Lãnh Địa Của Cổ Long Đất (Boss)",
        description: "Ác Mộng Đại Địa! Tyranitar Thần Thoại cùng Bạo Long xuất thế!",
        rewardGems: 1500,
        rewardExp: 1000,
        enemies: [
            // Mục đích: Boss thực sự của chuỗi Campaign tân thủ. Đẩy cấp độ hiếm lên Mythic để tạo áp lực khổng lồ.
            { species: "Garchomp", level: 18, rarity: "Legendary", statMult: 2.0 }, //[cite: 12]
            { species: "Rayquaza", level: 19, rarity: "Legendary", statMult: 2.0 }, //[cite: 12]
            { species: "Tyranitar", level: 20, rarity: "Mythic", statMult: 3.0 }    //[cite: 12]
        ]
    }
];
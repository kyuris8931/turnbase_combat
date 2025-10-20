/*
 * Gamicraft - Process Effects (End of Turn)
 * Version: 1.1 - Handles individual effects like Poison.
 *
 * Description:
 * Processes all active effects flagged to trigger at the END of a unit's turn.
 * This script runs BEFORE turn_manager.js.
 */

let taskerLogOutput = "";
function scriptLogger(message) { taskerLogOutput += `[END_TURN_FX] ${message}\\n`; }

var battle_state_out = battle_state; // Default output jika tidak ada perubahan

try {
    const bState = JSON.parse(battle_state);

    // Cek apakah ada efek aktif dan ID unit yang baru saja bertindak.
    if (!bState.active_effects || bState.active_effects.length === 0 || !bState.activeUnitID) {
        exit(); // Keluar jika tidak ada yang perlu diproses.
    }
    
    // Temukan unit yang BARU SAJA menyelesaikan gilirannya.
    const unitThatJustActed = bState.units.find(u => u.id === bState.activeUnitID);
    if (!unitThatJustActed) {
        exit();
    }

    scriptLogger(`Mengecek efek akhir giliran untuk ${unitThatJustActed.name}`);
    
    // Cari semua efek yang relevan untuk unit ini
    let effectsToProcess = bState.active_effects.filter(effect => 
        effect.trigger_phase === 'end_of_turn' && effect.target_id === unitThatJustActed.id
    );

    if (effectsToProcess.length > 0) {
        effectsToProcess.forEach(effect => {
            scriptLogger(`Memproses efek: "${effect.type}" dari skill "${effect.source_skill_name}"`);

            switch(effect.type.toLowerCase()) {
                case 'poison':
                    const damage = effect.damage || 5; // Ambil damage dari efek atau default 5
                    const oldHp = unitThatJustActed.stats.hp;
                    unitThatJustActed.stats.hp = Math.max(0, oldHp - damage);
                    
                    bState.battleMessage = `${unitThatJustActed.name} menerima ${damage} damage dari Poison!`;
                    scriptLogger(`${unitThatJustActed.name} menerima ${damage} damage. HP: ${oldHp} -> ${unitThatJustActed.stats.hp}`);
                    
                    // Set flag untuk UI agar bisa menampilkan pop-up damage
                    bState.lastActionDetails = {
                        actorId: unitThatJustActed.id,
                        effects: [{ type: 'damage', unitId: unitThatJustActed.id, amount: damage }]
                    };

                    if (unitThatJustActed.stats.hp === 0) {
                        unitThatJustActed.status = "Defeated";
                        scriptLogger(`${unitThatJustActed.name} dikalahkan oleh Poison!`);
                    }
                    break;
                
                // Tambahkan case lain di sini untuk efek end-of-turn lainnya,
                // contohnya: 'gain_gauge_end', 'self_repair', dll.
            }
        });

        // Kembalikan state yang sudah dimodifikasi
        battle_state_out = JSON.stringify(bState);
    }

} catch (e) {
    scriptLogger("ERROR: " + e.message);
}

// Set variabel output untuk Tasker
var js_script_log = taskerLogOutput;
var battle_state = battle_state_out;
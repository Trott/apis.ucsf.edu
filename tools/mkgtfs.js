#!/usr/local/bin/node

var schedules = {
    blue:[
        {stopId: 'missb4we', timeToNextStop: 22},
        {stopId: 'mtzion', timeToNextStop: 15},
        {stopId: 'parlppi', timeToNextStop: 23},
        {stopId: 'sfgh', timeToNextStop: 20},
    ],

    bronze_am:[
        {stopId: 'parlppi', timeToNextStop: 5},
        {stopId: '75behr', timeToNextStop: 4},
        {stopId: 'surgedown', timeToNextStop: 4},
        {stopId: 'paracc', timeToNextStop: 2, pickupType: 1},

    ],
    bronze_pm:[
        {stopId: 'parlppi', timeToNextStop: 5},
        {stopId: '75behr', timeToNextStop: 4},
        {stopId: 'surgedown', timeToNextStop: 4},
        {stopId: 'library', timeToNextStop: 7, pickupType: 1},
    ],
    bronze_acc:[
        {stopId: 'paracc', timeToNextStop: 1},
    ],
    gold:[
        {stopId: 'missb4we', timeToNextStop: 13},
        {stopId: 'sfgh', timeToNextStop: 27},
        {stopId: 'parlppi', timeToNextStop: 13},
        {stopId: 'mtzion', timeToNextStop: 27},
    ],
    green_chinbasn_to_654minn:[
        {stopId: 'chinbasn', timeToNextStop: 6},
        {stopId: 'missb4we', timeToNextStop: 5, headsign: 'to 654 Minnesota St.'},
        {stopId: '654minn', timeToNextStop: 18, pickupType: 1},

    ],
    green_654minn_to_chinbasn:[
        {stopId: 'missb4we', timeToNextStop: 2, headsign: 'to China Basin'},
        {stopId: 'mboi', timeToNextStop: 5},
        {stopId: 'caltrain', timeToNextStop: 3},
        {stopId: 'chinbasn', timeToNextStop: 11, pickupType: 1},
        {stopId: '654minn', timeToNextStop: 8},
    ],
    grey:[
        {stopId: 'missb4we', timeToNextStop: 30},
        {stopId: 'parlppi', timeToNextStop: 30},
    ],
    lime_am:[
        {stopId: 'mcb', timeToNextStop: 6},
        {stopId: 'buchanwb', timeToNextStop: 15},
        {stopId: 'library', timeToNextStop: 13},
        {stopId: 'buchaneb', timeToNextStop: 9},
    ],
    lime_am_rush:[
        {stopId: 'mcb', timeToNextStop: 6},
        {stopId: 'buchanwb', timeToNextStop: 17},
        {stopId: 'library', timeToNextStop: 15},
        {stopId: 'buchaneb', timeToNextStop: 12}
    ],
    lime_pm:[
        {stopId: 'mcb', timeToNextStop: 6},
        {stopId: 'buchanwb', timeToNextStop: 15},
        {stopId: 'library', timeToNextStop: 14},
        {stopId: 'buchaneb', timeToNextStop: 10}
    ],
    lime_pm_rush: [
        {stopId: 'mcb', timeToNextStop: 6},
        {stopId: 'buchanwb', timeToNextStop: 18},
        {stopId: 'library', timeToNextStop: 14},
        {stopId: 'buchaneb', timeToNextStop: 12},
    ],
    mtzionexpress: [
        {stopId: 'library', timeToNextStop: 15},
        {stopId: 'mtzion', timeToNextStop: 15},
    ],
    pink: [
        {stopId: 'parkezar', timeToNextStop: 6},
        {stopId: 'paracc', timeToNextStop: 9},
    ],
    purple_to_mtzion: [
        {stopId: 'library', timeToNextStop: 15},
        {stopId: '3360 Geary', timeToNextStop: 8, headsign: 'to Mt. Zion'},
        {stopId: 'mtzion', timeToNextStop: 22, pickupType: 1},
    ],
    purple_to_library: [
        {stopId: 'mtzion', timeToNextStop: 7},
        {stopId: '3360 Geary', timeToNextStop: 15, headsign: 'to Parnassus'},
        {stopId: 'library', timeToNextStop: 23, pickupType: 1},
    ],
    red_mb_to_bart: [
        {stopId: 'missb4th', timeToNextStop: 10},
        {stopId: 'mcb', timeToNextStop: 5, headsign: 'to 16th St. BART'},
        {stopId: '16thbart', timeToNextStop: 15, pickupType: 1},
    ],
    red_bart_to_mb: [
        {stopId: '16thbart', timeToNextStop: 5},
        {stopId: 'mcb', timeToNextStop: 10, headsign: 'to Mission Bay'},
        {stopId: 'missb4th', timeToNextStop: 15, pickupType: 1},
    ],
    red_mb_to_bart_rush: [
        {stopId: 'missb4th', timeToNextStop: 10},
        {stopId: 'mcb', timeToNextStop: 5, headsign: 'to 16th St. BART'},
        {stopId: '16thbart', timeToNextStop: 20, pickupType: 1},
    ],
    red_bart_to_mb_rush: [
        {stopId: '16thbart', timeToNextStop: 5},
        {stopId: 'mcb', timeToNextStop: 15, headsign: 'to Mission Bay'},
        {stopId: 'missb4th', timeToNextStop: 15, pickupType: 1},
    ],
    tan: [
        {stopId: 'library', timeToNextStop: 15},
        {stopId: 'lhts', timeToNextStop: 5},
        {stopId: 'mtzion', timeToNextStop: 20},
    ],
};

var fragments = {
    'blue_a': [
        {route: 'blue', startTime: '5:35', stopTime: '19:55'},
        {route: 'blue', startTime: '20:10', stopTime: '21:10'},
    ],
    'blue_b': [
        {route: 'blue', startTime: '5:55', stopTime: '20:15'},
    ],
    'blue_c': [
        {route: 'blue', startTime: '6:15', stopTime: '20:35'},
    ],
    'blue_d': [
        {route: 'blue', startTime: '6:35', stopTime: '19:35'},
    ],
    'blue_e1': [
        {route: 'blue', startTime: '7:00', stopTime: '11:00'},
    ],
    'blue_e2': [
        {route: 'blue', startTime: '14:45', stopTime: '18:45'},
    ],
    'bronze_a': [
        {route: 'bronze_am', startTime: '6:45', stopTime: '9:58'},
        {route: 'bronze_pm', startTime: '10:00', stopTime: '18:29'},
        {route: 'bronze_acc', startTime: '18:33', stopTime: '18:33'},
    ],
    'gold_a': [
        {route: 'gold', startTime: '5:45', stopTime: '19:58'},
    ],
    'gold_b': [
        {route: 'gold', startTime: '6:05', stopTime: '21:38'},
    ],
    'gold_c': [
        {route: 'gold', startTime: '6:25', stopTime: '19:18'},
    ],
    'gold_d': [
        {route: 'gold', startTime: '6:45', stopTime: '20:58'},
    ],
    'gold_e1': [
        {route: 'gold', startTime: '6:55', stopTime: '10:55'},
    ],
    'gold_e2': [
        {route: 'gold', startTime: '14:55', stopTime: '18:55'},
    ],
    'green_654minn_to_chinbasn_a': [
        {route: 'green_654minn_to_chinbasn', startTime: '6:25', stopTime: '18:48'},
    ],
    'green_chinbasn_to_654minn_a': [
        {route: 'green_chinbasn_to_654minn', startTime: '6:35', stopTime: '18:48'},
    ],
    'green_654minn_to_chinbasn_b': [
        {route: 'green_654minn_to_chinbasn', startTime: '6:40', stopTime: '18:32'},
    ],
    'green_chinbasn_to_654minn_b': [
        {route: 'green_chinbasn_to_654minn', startTime: '6:50', stopTime: '18:32'},
    ],
    'lime_a': [
        {route: 'lime_am', startTime: '6:05', stopTime: '7:22'},
        {route: 'lime_am_rush', startTime: '7:31', stopTime: '8:59'},
        {route: 'lime_pm', startTime: '9:11', stopTime: '15:46'},
        {route: 'lime_pm_rush', startTime: '15:56', stopTime: '18:14'},
        {route: 'lime_pm', startTime: '18:26', stopTime: '20:41'},
    ],
    'lime_b': [
        {route: 'lime_am', startTime: '6:20', stopTime: '7:37'},
        {route: 'lime_am_rush', startTime: '7:46', stopTime: '9:14'},
        {route: 'lime_pm', startTime: '9:26', stopTime: '16:01'},
        {route: 'lime_pm_rush', startTime: '16:11', stopTime: '18:29'},
        {route: 'lime_pm', startTime: '18:41', stopTime: '20:11'},
    ],
    'lime_c': [
        {route: 'lime_am', startTime: '6:35', stopTime: '7:52'},
        {route: 'lime_am_rush', startTime: '8:01', stopTime: '9:29'},
        {route: 'lime_pm', startTime: '9:41', stopTime: '16:16'},
        {route: 'lime_pm_rush', startTime: '16:26', stopTime: '18:44'},
        {route: 'lime_pm', startTime: '18:56', stopTime: '20:26'},
    ],
    'mtzionexpress_am': [
        {route: 'mtzionexpress', startTime: '6:15', stopTime: '14:00'},
    ],
    'mtzionexpress_pm': [
        {route: 'mtzionexpress', startTime: '14:45', stopTime: '18:45'},
    ],
    'pink_a': [
        {route: 'pink', startTime: '5:30', stopTime: '9:06'},
    ],
    'purple_to_mtzion_a': [
        {route: 'purple_to_mtzion', startTime: '6:15', stopTime: '18:38'},
    ],
    'purple_to_library_a': [
        {route: 'purple_to_library', startTime: '6:38', stopTime: '18:45'},
    ],
    'red_bart_to_mb_a': [
        {route: 'red_bart_to_mb', startTime: '6:10', stopTime: '14:55'},
        {route: 'red_bart_to_mb_rush', startTime: '15:10', stopTime: '18:25'},
        {route: 'red_bart_to_mb', startTime: '18:40', stopTime: '19:55'},
    ],
    'red_mb_to_bart_a': [
        {route: 'red_mb_to_bart', startTime: '5:55', stopTime: '15:10'},
        {route: 'red_mb_to_bart_rush', startTime: '15:30', stopTime: '18:05'},
        {route: 'red_mb_to_bart', startTime: '18:25', stopTime: '19:40'},
    ],
    'red_bart_to_mb_b': [
        {route: 'red_bart_to_mb', startTime: '6:25', stopTime: '14:40'},
        {route: 'red_bart_to_mb_rush', startTime: '14:55', stopTime: '18:10'},
        {route: 'red_bart_to_mb', startTime: '18:25', stopTime: '19:40'},
    ],
    'red_mb_to_bart_b': [
        {route: 'red_mb_to_bart', startTime: '6:10', stopTime: '14:25'},
        {route: 'red_mb_to_bart_rush', startTime: '14:40', stopTime: '17:50'},
        {route: 'red_mb_to_bart', startTime: '18:10', stopTime: '19:25'},
    ],
    'red_bart_to_mb_c1': [
        {route: 'red_bart_to_mb', startTime: '6:45', stopTime: '10:00'},
    ],
    'red_mb_to_bart_c1': [
        {route: 'red_mb_to_bart', startTime: '6:30', stopTime: '9:45'},
    ],
    'red_bart_to_mb_c2': [
        {route: 'red_bart_to_mb_rush', startTime: '15:20', stopTime: '18:00'},
    ],
    'red_mb_to_bart_c2': [
        {route: 'red_mb_to_bart_rush', startTime: '15:05', stopTime: '17:40'},
    ],
    'tan_a': [
        {route: 'tan', startTime: '6:50', stopTime: '19:50'},
    ],
    'tan_b': [
        {route: 'tan', startTime: '7:10', stopTime: '19:30'},
    ],
};

var fragment;
var schedule;
var stopTime;
var time;
var step;

var pad = function (n) { return n<10 ? '0'+n : n; };

var increment = function (minutes) {
    time = new Date(time.getTime() + (minutes * 60 * 1000));
};

var gtfs = [];
var runFragments;

for (var run in fragments) {
    runFragments = fragments[run];
    step = 1;

    for (var j = 0, m = runFragments.length; j < m; j++) {
        fragment = runFragments[j];
        schedule = schedules[fragment.route];
        stopTime = new Date('Tue Sep 17 2013 ' + fragment.stopTime);
        time = new Date('Tue Sep 17 2013 ' + fragment.startTime);

        while (time <= stopTime) {
            for (var i = 0, l = schedule.length; i< l; i++) {
                gtfs.push([
                    run,
                    [pad(time.getHours()), pad(time.getMinutes()), '00'].join(':'),
                    [pad(time.getHours()), pad(time.getMinutes()), '00'].join(':'),
                    schedule[i].stopId,
                    step++,
                    (schedule[i].headsign && (j<m-1 || time<stopTime)) ? schedule[i].headsign : '',
                    schedule[i].pickupType || (j==m-1 && time>=stopTime) ? 1 : 0
                ]);
                increment(schedule[i].timeToNextStop);
                if (time > stopTime) {
                    break;
                }
            }
        }
    }
}

for (i = 0, l = gtfs.length; i<l; i++) {
    console.log(gtfs[i].join(','));
}
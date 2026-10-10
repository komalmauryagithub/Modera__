import {
  startOfMonth,
  endOfMonth,
  startOfWeek,
  endOfWeek,
  eachDayOfInterval,
  format,
  addMonths,
  subMonths,
} from 'date-fns';

console.log('--- STARTING PHASE 5 CALENDAR MATH & TIMEZONE SUITE ---');

// Test 1: Leap Year Feb 2024 (29 days)
const feb2024 = new Date(2024, 1, 1);
const feb2024End = endOfMonth(feb2024);
const feb2024DaysCount = parseInt(format(feb2024End, 'd'), 10);
console.log(`[TEST 1] Feb 2024 Leap Year Days: ${feb2024DaysCount}`);
if (feb2024DaysCount !== 29) throw new Error('Test 1 Failed: Expected 29 days in Feb 2024');
console.log('✓ PASS: Leap year February 2024 correctly identified with 29 days.');

// Test 2: Non-Leap Year Feb 2026 (28 days)
const feb2026 = new Date(2026, 1, 1);
const feb2026End = endOfMonth(feb2026);
const feb2026DaysCount = parseInt(format(feb2026End, 'd'), 10);
console.log(`[TEST 2] Feb 2026 Days: ${feb2026DaysCount}`);
if (feb2026DaysCount !== 28) throw new Error('Test 2 Failed: Expected 28 days in Feb 2026');
console.log('✓ PASS: Non-leap year February 2026 correctly identified with 28 days.');

// Test 3: Leap Year Feb 2028 (29 days)
const feb2028 = new Date(2028, 1, 1);
const feb2028End = endOfMonth(feb2028);
const feb2028DaysCount = parseInt(format(feb2028End, 'd'), 10);
console.log(`[TEST 3] Feb 2028 Leap Year Days: ${feb2028DaysCount}`);
if (feb2028DaysCount !== 29) throw new Error('Test 3 Failed: Expected 29 days in Feb 2028');
console.log('✓ PASS: Leap year February 2028 correctly identified with 29 days.');

// Test 4: Year Transition Navigation (Dec 2026 -> Jan 2027)
const dec2026 = new Date(2026, 11, 15);
const nextMonth = addMonths(dec2026, 1);
const formattedNext = format(nextMonth, 'yyyy-MM');
console.log(`[TEST 4] Year Transition (Dec 2026 + 1 month): ${formattedNext}`);
if (formattedNext !== '2027-01') throw new Error('Test 4 Failed: Expected 2027-01');
const prevBack = subMonths(nextMonth, 1);
const formattedPrev = format(prevBack, 'yyyy-MM');
if (formattedPrev !== '2026-12') throw new Error('Test 4 Failed: Expected 2026-12 on subMonths');
console.log('✓ PASS: Year transition and back-navigation work seamlessly.');

// Test 5: October 2026 Weekday Alignment
const oct2026 = new Date(2026, 9, 1);
const monthStart = startOfMonth(oct2026);
const monthEnd = endOfMonth(oct2026);
const gridStart = startOfWeek(monthStart, { weekStartsOn: 0 });
const gridEnd = endOfWeek(monthEnd, { weekStartsOn: 0 });
const days = eachDayOfInterval({ start: gridStart, end: gridEnd });

console.log(`[TEST 5] Oct 2026 Grid: Starts on ${format(gridStart, 'EEEE, yyyy-MM-dd')}, Ends on ${format(gridEnd, 'EEEE, yyyy-MM-dd')}`);
console.log(`Total Grid Cells: ${days.length} (Must be multiple of 7)`);
if (days.length % 7 !== 0) throw new Error('Test 5 Failed: Grid days count is not a multiple of 7');
if (format(gridStart, 'EEEE') !== 'Sunday') throw new Error('Test 5 Failed: Grid must start on Sunday');
if (format(gridEnd, 'EEEE') !== 'Saturday') throw new Error('Test 5 Failed: Grid must end on Saturday');
console.log('✓ PASS: Weekday grid matrix starts Sunday and ends Saturday with perfect 7-column alignment.');

// Test 6: Timezone-Safe String Formatting
const testDate = new Date(2026, 9, 15, 23, 59, 59); // 11:59 PM local
const dateStr = format(testDate, 'yyyy-MM-dd');
if (dateStr !== '2026-10-15') throw new Error('Test 6 Failed: Date formatting shifted across day boundary!');
console.log(`[TEST 6] Local Date preserved cleanly: ${dateStr}`);
console.log('✓ PASS: Date formatted safely without timezone offset shift.');

console.log('\n===========================================');
console.log('ALL PHASE 5 CALENDAR TESTS PASSED!');
console.log('===========================================');

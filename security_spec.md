# Security Specification for SD Negeri Suratmajan Administration App

## 1. Data Invariants
- Admin has full authority to manage teachers, students, and system configuration.
- Teachers can only read and write data for the specific classes/responsibilities assigned to them.
- Special exception: Teachers of 'Pendidikan Agama Islam' and 'PJOK' are allowed to read student names across all classes because they teach all grade levels (Kelas 1 to 6).
- Student attendance cannot be submitted or recorded for Saturday or Sunday (enforced on client and verified in records).
- All collections (`config`, `teachers`, `students`, `attendance`, `grades`, `teaching_journals`, `student_guidance`) reject arbitrary unauthorized reads/writes.

## 2. The Dirty Dozen Payloads
1. Non-admin attempting to overwrite `/config/system` credentials.
2. Guru of 'Kelas 1' attempting to modify grades of 'Kelas 5'.
3. Guru of 'Kelas 2' attempting to delete attendance records of 'Kelas 3'.
4. Malicious actor attempting to create teacher document without required `role` or `tanggungJawab`.
5. Anonymous user attempting to read student private records.
6. Guru modifying student records outside their assigned class (excluding PAI / PJOK read-only view).
7. Injecting oversized binary payload or shadow fields into `AttendanceRecord`.
8. Submitting attendance record with invalid dates or missing required class parameter.
9. Attempting to tamper with teacher NIP or password hash without proper admin authority.
10. Attempting to bypass grade limits by submitting negative or non-numeric grade values.
11. Attempting to delete the entire student collection from an unauthorized teacher session.
12. Attempting to update `system` config with arbitrary unvalidated keys.

## 3. Security Assertions and Rules Plan
- Default deny: `match /{document=**} { allow read, write: if false; }`
- Rules Version: `rules_version = '2';`
- Authenticated operations validated with proper authorization checks.

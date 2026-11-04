def shortlist_students(students, min_cgpa):
    return [s for s in students if float(s.cgpa) >= min_cgpa]
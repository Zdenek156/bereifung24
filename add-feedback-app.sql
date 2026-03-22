-- App Feedback table
CREATE TABLE IF NOT EXISTS app_feedback (
    id TEXT PRIMARY KEY,
    user_id TEXT NOT NULL,
    rating INTEGER NOT NULL CHECK (rating >= 1 AND rating <= 5),
    comment TEXT,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_app_feedback_user_id ON app_feedback(user_id);
CREATE INDEX IF NOT EXISTS idx_app_feedback_rating ON app_feedback(rating);
CREATE INDEX IF NOT EXISTS idx_app_feedback_created_at ON app_feedback(created_at);

-- Register feedback application for admin access
INSERT INTO applications ("applicationKey", name, description, icon, color, category, "sortOrder", "createdAt", "updatedAt")
VALUES ('feedback', 'App-Feedback', 'Kundenbewertungen aus der Bereifung24 App', 'MessageSquareHeart', 'pink', 'OPERATIONS', 47, NOW(), NOW())
ON CONFLICT ("applicationKey") DO NOTHING;

-- Assign to employees who have push-benachrichtigungen or customers access
INSERT INTO employee_applications ("employeeId", "applicationKey", "createdAt", "updatedAt")
SELECT ea."employeeId", 'feedback', NOW(), NOW()
FROM employee_applications ea
WHERE ea."applicationKey" IN ('customers', 'push-benachrichtigungen')
AND NOT EXISTS (
    SELECT 1 FROM employee_applications ea2
    WHERE ea2."employeeId" = ea."employeeId"
    AND ea2."applicationKey" = 'feedback'
)
GROUP BY ea."employeeId";

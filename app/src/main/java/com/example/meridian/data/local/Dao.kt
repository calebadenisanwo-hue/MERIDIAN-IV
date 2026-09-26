package com.example.meridian.data.local

import androidx.room.Dao
import androidx.room.Insert
import androidx.room.OnConflictStrategy
import androidx.room.Query
import com.example.meridian.data.model.*
import kotlinx.coroutines.flow.Flow

@Dao
interface JournalDao {
    @Query("SELECT * FROM journal_entries ORDER BY timestamp DESC")
    fun getAll(): Flow<List<JournalEntryEntity>>

    @Insert(onConflict = OnConflictStrategy.REPLACE)
    suspend fun insert(entry: JournalEntryEntity)

    @Query("DELETE FROM journal_entries WHERE id = :id")
    suspend fun deleteById(id: String)
}

@Dao
interface StudyDao {
    @Query("SELECT * FROM study_logs ORDER BY date DESC, timestamp DESC")
    fun getAllLogs(): Flow<List<StudyLogEntity>>

    @Insert(onConflict = OnConflictStrategy.REPLACE)
    suspend fun insertLog(log: StudyLogEntity)

    @Query("DELETE FROM study_logs WHERE id = :id")
    suspend fun deleteLogById(id: String)

    @Query("SELECT * FROM study_topic_progress")
    fun getTopicProgress(): Flow<List<StudyTopicProgressEntity>>

    @Insert(onConflict = OnConflictStrategy.REPLACE)
    suspend fun setTopicProgress(progress: StudyTopicProgressEntity)

    @Query("DELETE FROM study_topic_progress WHERE topicId = :topicId")
    suspend fun removeTopicProgress(topicId: String)
}

@Dao
interface RecoveryDao {
    @Query("SELECT * FROM recovery_quits")
    fun getAllQuits(): Flow<List<RecoveryQuitEntity>>

    @Insert(onConflict = OnConflictStrategy.REPLACE)
    suspend fun insertQuit(quit: RecoveryQuitEntity)

    @Query("DELETE FROM recovery_quits WHERE id = :id")
    suspend fun deleteQuit(id: String)

    @Query("SELECT * FROM recovery_logs ORDER BY date DESC, timestamp DESC")
    fun getAllLogs(): Flow<List<RecoveryLogEntity>>

    @Insert(onConflict = OnConflictStrategy.REPLACE)
    suspend fun insertLog(log: RecoveryLogEntity)
}

@Dao
interface FinanceDao {
    @Query("SELECT * FROM finance_accounts")
    fun getAllAccounts(): Flow<List<FinanceAccountEntity>>

    @Insert(onConflict = OnConflictStrategy.REPLACE)
    suspend fun insertAccount(account: FinanceAccountEntity)

    @Query("SELECT * FROM finance_categories")
    fun getAllCategories(): Flow<List<FinanceCategoryEntity>>

    @Insert(onConflict = OnConflictStrategy.REPLACE)
    suspend fun insertCategory(category: FinanceCategoryEntity)

    @Query("SELECT * FROM finance_transactions ORDER BY date DESC, timestamp DESC")
    fun getAllTransactions(): Flow<List<FinanceTransactionEntity>>

    @Insert(onConflict = OnConflictStrategy.REPLACE)
    suspend fun insertTransaction(transaction: FinanceTransactionEntity)

    @Query("DELETE FROM finance_transactions WHERE id = :id")
    suspend fun deleteTransaction(id: String)
}

@Dao
interface PulseDao {
    @Query("SELECT * FROM pulse_logs ORDER BY date DESC")
    fun getAllLogs(): Flow<List<PulseLogEntity>>

    @Insert(onConflict = OnConflictStrategy.REPLACE)
    suspend fun insertLog(log: PulseLogEntity)

    @Query("SELECT * FROM pulse_habits WHERE archived = 0")
    fun getHabits(): Flow<List<PulseHabitEntity>>

    @Insert(onConflict = OnConflictStrategy.REPLACE)
    suspend fun insertHabit(habit: PulseHabitEntity)
}

@Dao
interface GoalsDao {
    @Query("SELECT * FROM goals WHERE archived = 0 ORDER BY createdAt DESC")
    fun getGoals(): Flow<List<GoalItemEntity>>

    @Insert(onConflict = OnConflictStrategy.REPLACE)
    suspend fun insertGoal(goal: GoalItemEntity)

    @Query("DELETE FROM goals WHERE id = :id")
    suspend fun deleteGoal(id: String)

    @Query("SELECT * FROM goal_checkins ORDER BY date DESC, timestamp DESC")
    fun getCheckins(): Flow<List<GoalCheckinEntity>>

    @Insert(onConflict = OnConflictStrategy.REPLACE)
    suspend fun insertCheckin(checkin: GoalCheckinEntity)
}

@Dao
interface CompositeDao {
    @Query("SELECT * FROM composite_history ORDER BY date ASC")
    fun getHistory(): Flow<List<CompositeHistoryEntity>>

    @Insert(onConflict = OnConflictStrategy.REPLACE)
    suspend fun recordSnapshot(entity: CompositeHistoryEntity)
}

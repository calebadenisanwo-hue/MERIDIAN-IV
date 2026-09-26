package com.example.meridian.data.local

import android.content.Context
import androidx.room.Database
import androidx.room.Room
import androidx.room.RoomDatabase
import com.example.meridian.data.model.*

@Database(
    entities = [
        JournalEntryEntity::class,
        StudyLogEntity::class,
        StudyTopicProgressEntity::class,
        RecoveryQuitEntity::class,
        RecoveryLogEntity::class,
        FinanceAccountEntity::class,
        FinanceCategoryEntity::class,
        FinanceTransactionEntity::class,
        PulseLogEntity::class,
        PulseHabitEntity::class,
        GoalItemEntity::class,
        GoalCheckinEntity::class,
        CompositeHistoryEntity::class
    ],
    version = 1,
    exportSchema = false
)
abstract class MeridianDatabase : RoomDatabase() {
    abstract fun journalDao(): JournalDao
    abstract fun studyDao(): StudyDao
    abstract fun recoveryDao(): RecoveryDao
    abstract fun financeDao(): FinanceDao
    abstract fun pulseDao(): PulseDao
    abstract fun goalsDao(): GoalsDao
    abstract fun compositeDao(): CompositeDao

    companion object {
        @Volatile
        private var INSTANCE: MeridianDatabase? = null

        fun getInstance(context: Context): MeridianDatabase {
            return INSTANCE ?: synchronized(this) {
                val instance = Room.databaseBuilder(
                    context.applicationContext,
                    MeridianDatabase::class.java,
                    "meridian_db"
                ).build()
                INSTANCE = instance
                instance
            }
        }
    }
}

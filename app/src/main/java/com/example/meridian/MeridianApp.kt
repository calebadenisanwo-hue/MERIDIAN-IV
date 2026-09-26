package com.example.meridian

import android.app.Application
import com.example.meridian.data.local.MeridianDatabase
import com.example.meridian.data.repository.MeridianRepository
import kotlinx.coroutines.CoroutineScope
import kotlinx.coroutines.Dispatchers
import kotlinx.coroutines.launch

class MeridianApp : Application() {
    val database by lazy { MeridianDatabase.getInstance(this) }
    val repository by lazy { MeridianRepository(database) }

    override fun onCreate() {
        super.onCreate()
        CoroutineScope(Dispatchers.IO).launch {
            repository.seedDefaultsIfNeeded()
        }
    }
}
